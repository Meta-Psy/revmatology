import { Component, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, X } from 'lucide-react';

import { usePdfManifest } from './usePdfManifest';
import { pageImageUrl, pageSrcSet } from './pdfUrls';
import PdfToolbar, { PdfFileLinks } from './PdfToolbar';
import PdfOutline from './PdfOutline';

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;
const SWIPE_MIN_PX = 50;
const MODE_KEY = 'pdfViewer.mode';
const DESKTOP_QUERY = '(min-width: 1024px)';
// Пока манифеста нет: заготовка A4 и предзагрузка первой страницы по договорным ширинам
const PLACEHOLDER_RATIO = '1 / 1.414';
const PRELOAD_WIDTHS = [800, 1600];
// Ширина области страниц у просмотра: окно минус отступы секции, карточки и области
// (ПК — max-w-5xl), чтобы предзагрузка выбрала тот же файл, что потом покажет просмотр
const PRELOAD_SIZES = '(min-width:1024px) 860px, (min-width:640px) calc(100vw - 130px), calc(100vw - 74px)';
// Адрес #page=N пишется, когда пользователь задержался на странице: WebKit
// бросает SecurityError после 100 вызовов replaceState за 10 с
const HASH_DELAY_MS = 400;
const PAGE_HASH = /^#page=\d+$/;
// Зазор между панелью и верхом страницы при прокрутке к ней
const SCROLL_GAP_PX = 8;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const readMode = () => {
  try {
    return localStorage.getItem(MODE_KEY) === 'single' ? 'single' : 'continuous';
  } catch {
    return 'continuous';
  }
};

const saveMode = (mode) => {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // localStorage недоступен (приватный режим) — просто не запоминаем
  }
};

const isDesktop = () => typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches;

const pageFromHash = () => {
  const match = /^#page=(\d+)$/.exec(window.location.hash);
  return match ? Number(match[1]) : null;
};

// Чужой хеш (#section) не трогаем; #page=1 без хеша не пишем — адрес и так ведёт на начало
const writePageHash = (page) => {
  const { hash } = window.location;
  if (hash && !PAGE_HASH.test(hash)) return;
  if (!hash && page === 1) return;
  const target = `#page=${page}`;
  if (hash === target) return;
  try {
    window.history.replaceState(window.history.state, '', target);
  } catch {
    // лимит WebKit или запрет браузера — адрес просто не обновится
  }
};

const isTypingTarget = (el) =>
  Boolean(el) && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const isOnScreen = (el) => {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
};

/**
 * Граница ошибок вокруг просмотра: любая ошибка рендера или эффекта в читалке
 * даёт кнопки «Открыть PDF»/«Скачать», а не белый экран всего сайта.
 * Классом — иначе в React границу ошибок не сделать (единственное исключение
 * из «только функциональные компоненты»).
 */
class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Промис из Fullscreen API может отклониться (нет жеста пользователя и т. п.) — это не ошибка страницы
const ignoreRejection = (maybePromise) => {
  if (maybePromise && typeof maybePromise.catch === 'function') maybePromise.catch(() => {});
};

/**
 * Читалка готовых страниц: непрерывный и постраничный режимы, масштаб,
 * оглавление, полный экран, #page=N в адресе.
 */
const PdfReader = ({ manifest, pdfUrl, title, downloadName }) => {
  const { t } = useTranslation();
  const { pages, widths, outline } = manifest;
  const total = pages.length;
  const hasOutline = outline.length > 0;

  const [initialPage] = useState(() => {
    const fromHash = pageFromHash();
    return fromHash ? clamp(fromHash, 1, total) : 1;
  });
  const [current, setCurrent] = useState(initialPage);
  const [mode, setMode] = useState(readMode);
  const [zoom, setZoom] = useState(100);
  // null — ещё не замерили; до замера картинки не вставляем, иначе браузер
  // выберет вариант по неверному sizes и скачает лишний файл
  const [areaWidth, setAreaWidth] = useState(null);
  const [outlineOpen, setOutlineOpen] = useState(() => hasOutline && isDesktop());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen] = useState(() => document.fullscreenEnabled === true);
  // Отступ прокрутки страниц = место панели под шапкой + её фактическая высота
  const [scrollMargin, setScrollMargin] = useState(null);

  const rootRef = useRef(null);
  const areaRef = useRef(null);
  const toolbarRef = useRef(null);
  const outlineButtonRef = useRef(null);
  const closeOutlineRef = useRef(null);
  const pageEls = useRef(new Map());
  const touchStart = useRef(null);
  // К какой странице прокрутить, когда непрерывный режим отрисуется
  // (#page=N, смена режима, масштаб, вход/выход из полного экрана)
  const scrollTarget = useRef(initialPage > 1 ? initialPage : null);
  const currentRef = useRef(current);
  const outlineWasOpen = useRef(outlineOpen);

  useEffect(() => { currentRef.current = current; }, [current]);

  // Ширина области страниц → sizes у картинок: браузер сам выберет 800w или 1600w
  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => setAreaWidth(Math.round(entries[0].contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Высота панели (на телефоне она в два ряда) и её sticky-top (шапка сайта; в полном
  // экране — 0) → scroll-margin страниц: переход к странице не прячет её верх под панель
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height;
      const stickyTop = parseFloat(window.getComputedStyle(el).top) || 0;
      setScrollMargin(Math.round(stickyTop + height + SCROLL_GAP_PX));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // 'instant': у html стоит scroll-behavior: smooth, а плавный проезд через
  // десяток страниц заодно запустил бы загрузку всех lazy-картинок по пути
  useEffect(() => {
    if (mode !== 'continuous' || scrollTarget.current == null) return;
    pageEls.current.get(scrollTarget.current)?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
    scrollTarget.current = null;
  }, [mode, zoom, isFullscreen]);

  // Текущая страница в непрерывном режиме — та, что пересекает середину окна
  useEffect(() => {
    if (mode !== 'continuous' || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const hits = entries.filter((e) => e.isIntersecting).map((e) => Number(e.target.dataset.page));
      if (hits.length > 0) setCurrent(Math.max(...hits));
    }, { rootMargin: '-50% 0px -50% 0px' });
    pageEls.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mode, pages]);

  // Ссылка на страницу: replaceState (не засоряет «Назад»), когда пользователь
  // остановился на странице, а не на каждой пролистанной
  useEffect(() => {
    const timer = setTimeout(() => writePageHash(current), HASH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current]);

  // Постраничный режим: страница сменилась, а верх просмотра уехал вверх — вернуть в поле зрения
  useEffect(() => {
    if (mode !== 'single') return;
    const el = rootRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView?.({ behavior: 'instant', block: 'start' });
  }, [mode, current]);

  // Вход и выход из полного экрана меняют раскладку и контейнер прокрутки —
  // возвращаемся к той же странице
  useEffect(() => {
    const onChange = () => {
      scrollTarget.current = currentRef.current;
      setIsFullscreen(Boolean(rootRef.current) && document.fullscreenElement === rootRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Выдвижное оглавление на телефоне: фокус в панель при открытии и обратно
  // на кнопку при закрытии; на ПК это колонка — фокус не переносим
  useEffect(() => {
    if (outlineOpen === outlineWasOpen.current) return;
    outlineWasOpen.current = outlineOpen;
    if (isDesktop()) return;
    if (outlineOpen) closeOutlineRef.current?.focus();
    else outlineButtonRef.current?.focus({ preventScroll: true });
  }, [outlineOpen]);

  useEffect(() => {
    if (!outlineOpen || isDesktop()) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOutlineOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [outlineOpen]);

  const step = useCallback((delta) => setCurrent((c) => clamp(c + delta, 1, total)), [total]);

  // Постраничный режим: ←/→ и PageUp/PageDown листают PDF, только если фокус внутри
  // просмотра или на body при просмотре на экране. Иначе клавиши принадлежат странице
  // (фокус на ссылке ниже просмотра — PageDown прокручивает окно, как обычно).
  useEffect(() => {
    if (mode !== 'single') return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isTypingTarget(e.target)) return;
      const root = rootRef.current;
      if (!root) return;
      const inside = e.target instanceof Node && root.contains(e.target);
      const onBody = e.target === document.body || e.target === document.documentElement;
      if (!inside && !(onBody && isOnScreen(root))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, step]);

  const goTo = (n) => {
    const page = clamp(n, 1, total);
    // соседняя страница — плавно, дальний переход — сразу (см. выше про lazy)
    const behavior = Math.abs(page - current) > 1 ? 'instant' : 'smooth';
    setCurrent(page);
    if (mode === 'continuous') pageEls.current.get(page)?.scrollIntoView?.({ behavior, block: 'start' });
  };

  const changeMode = (next) => {
    if (next === mode) return;
    if (next === 'continuous') scrollTarget.current = current;
    setMode(next);
    saveMode(next);
  };

  const zoomBy = (delta) => {
    const next = clamp(zoom + delta, ZOOM_MIN, ZOOM_MAX);
    if (next === zoom) return;
    // страницы меняют высоту — держим в поле зрения текущую
    if (mode === 'continuous') scrollTarget.current = current;
    setZoom(next);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) ignoreRejection(document.exitFullscreen?.());
    else ignoreRejection(rootRef.current?.requestFullscreen?.());
  };

  const selectOutline = (page) => {
    goTo(page);
    if (!isDesktop()) setOutlineOpen(false);
  };

  // Свайп в постраничном режиме. Щипок (два пальца) и прокрутка увеличенной
  // страницы — не свайп; сами жесты браузера не блокируем (без preventDefault).
  const onTouchStart = (e) => {
    touchStart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };
  const onTouchMove = (e) => {
    if (e.touches.length > 1) touchStart.current = null;
  };
  const onTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = e.changedTouches[0];
    if (!start || !end || zoom > 100 || (window.visualViewport?.scale ?? 1) > 1) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  // Без ResizeObserver (старые браузеры, jsdom) — сразу, с sizes по ширине окна
  const measured = areaWidth !== null || typeof ResizeObserver === 'undefined';
  const sizes = areaWidth > 0 ? `${Math.round((areaWidth * zoom) / 100)}px` : `${zoom}vw`;

  const imageProps = (page, eager) => ({
    sizes,
    srcSet: pageSrcSet(pdfUrl, page.n, widths, page.w),
    src: pageImageUrl(pdfUrl, page.n, widths[0]),
    width: page.w,
    height: page.h,
    loading: eager ? 'eager' : 'lazy',
    fetchPriority: eager ? 'high' : undefined,
    decoding: 'async',
  });

  const renderPage = (page, eager) => (
    <div
      key={page.n}
      ref={(el) => {
        if (el) pageEls.current.set(page.n, el);
        else pageEls.current.delete(page.n);
      }}
      data-page={page.n}
      // scroll-mt-* — только запас на случай браузера без ResizeObserver
      className="scroll-mt-40 sm:scroll-mt-36 bg-white shadow-sm ring-1 ring-stone-200"
      style={{
        aspectRatio: `${page.w} / ${page.h}`,
        ...(scrollMargin !== null && { scrollMarginTop: `${scrollMargin}px` }),
      }}
    >
      {measured && (
        <img
          data-page-img
          {...imageProps(page, eager)}
          alt={t('pdfViewer.pageAlt', { title, n: page.n })}
          className="block w-full h-full"
        />
      )}
    </div>
  );

  const single = mode === 'single';
  const nextPage = single && measured ? pages[current] : null;

  return (
    <div
      ref={rootRef}
      data-pdf-viewer
      className={`relative scroll-mt-16 sm:scroll-mt-20 rounded-xl border border-stone-200 bg-stone-100 ${
        isFullscreen ? 'overflow-y-auto' : ''
      }`}
    >
      <PdfToolbar
        ref={toolbarRef}
        outlineButtonRef={outlineButtonRef}
        className={`sticky z-20 ${isFullscreen ? 'top-0' : 'top-16 sm:top-20'}`}
        current={current}
        total={total}
        onGoTo={goTo}
        zoom={zoom}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(-ZOOM_STEP)}
        canZoomIn={zoom < ZOOM_MAX}
        canZoomOut={zoom > ZOOM_MIN}
        mode={mode}
        onModeChange={changeMode}
        hasOutline={hasOutline}
        outlineOpen={outlineOpen}
        onToggleOutline={() => setOutlineOpen((open) => !open)}
        canFullscreen={canFullscreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        pdfUrl={pdfUrl}
        downloadName={downloadName}
      />

      <div className="flex items-start">
        {hasOutline && outlineOpen && (
          <>
            {/* На телефоне — выдвижная панель поверх страницы, на ПК — колонка слева */}
            <div
              className="fixed inset-0 z-[55] bg-slate-900/40 lg:hidden"
              onClick={() => setOutlineOpen(false)}
              aria-hidden="true"
            />
            <aside
              aria-label={t('pdfViewer.outlineNav')}
              className={`fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] overflow-y-auto overscroll-contain bg-white shadow-xl
                lg:sticky lg:bottom-auto lg:z-10 lg:w-64 lg:shrink-0 lg:max-h-[calc(100vh-10rem)] lg:shadow-none lg:border-r lg:border-stone-200 ${
                  isFullscreen ? 'lg:top-14' : 'lg:top-36'
                }`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 lg:hidden">
                <span className="text-sm font-medium text-stone-800">{t('pdfViewer.outline')}</span>
                <button
                  ref={closeOutlineRef}
                  type="button"
                  onClick={() => setOutlineOpen(false)}
                  aria-label={t('pdfViewer.closeOutline')}
                  className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="py-2">
                <PdfOutline items={outline} currentPage={current} onSelect={selectOutline} />
              </div>
            </aside>
          </>
        )}

        <div
          ref={areaRef}
          data-pdf-area
          className="flex-1 min-w-0 overflow-x-auto px-2 py-3 sm:px-4 sm:py-4"
          onTouchStart={single ? onTouchStart : undefined}
          onTouchMove={single ? onTouchMove : undefined}
          onTouchEnd={single ? onTouchEnd : undefined}
        >
          <div className="mx-auto space-y-3 sm:space-y-4" style={{ width: `${zoom}%` }}>
            {single
              ? renderPage(pages[current - 1], true)
              : pages.map((page) => renderPage(page, page.n === 1 || page.n === initialPage))}
          </div>
          {/* Следующая страница грузится заранее: скрытая картинка без lazy всё равно скачивается */}
          {nextPage && <img data-preload hidden aria-hidden="true" alt="" {...imageProps(nextPage, true)} fetchPriority="low" />}
        </div>
      </div>

      {manifest.truncated && (
        <p className="px-4 pb-4 text-sm text-stone-600" style={{ fontFamily: 'Georgia, serif' }}>
          {t('pdfViewer.truncated', { rendered: total, total: manifest.page_count })}{' '}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-700 underline hover:text-cyan-800">
            {t('pdfViewer.open')}
          </a>
        </p>
      )}
    </div>
  );
};

/**
 * Быстрый просмотр PDF готовыми WebP-страницами с сервера (К-08).
 * Страниц нет (ещё рисуются, ошибка, внешняя ссылка) — кнопки «Открыть PDF» и «Скачать».
 */
const PdfPages = ({ pdfUrl, title, downloadName }) => {
  const { t } = useTranslation();
  const { status, manifest, retry } = usePdfManifest(pdfUrl);

  if (status === 'ready') {
    return (
      <ViewerErrorBoundary
        key={pdfUrl}
        fallback={(
          <div className="flex flex-wrap items-center gap-3">
            <PdfFileLinks pdfUrl={pdfUrl} downloadName={downloadName} />
          </div>
        )}
      >
        <PdfReader manifest={manifest} pdfUrl={pdfUrl} title={title} downloadName={downloadName} />
      </ViewerErrorBoundary>
    );
  }

  const links = (
    <div className="flex flex-wrap items-center gap-3">
      <PdfFileLinks pdfUrl={pdfUrl} downloadName={downloadName} />
      {status === 'error' && (
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
        >
          <RotateCw className="w-4 h-4" aria-hidden="true" />
          <span>{t('pdfViewer.retry')}</span>
        </button>
      )}
    </div>
  );

  if (status === 'external') return links;

  if (status === 'error') {
    return (
      <div data-pdf-viewer className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center">
        <p className="text-stone-700 mb-1" style={{ fontFamily: 'Georgia, serif' }}>{t('pdfViewer.preparing')}</p>
        <p className="text-sm text-stone-500 mb-4" style={{ fontFamily: 'Georgia, serif' }}>{t('pdfViewer.preparingHint')}</p>
        <div className="flex justify-center">{links}</div>
      </div>
    );
  }

  // Загрузка манифеста: заготовка страницы, а первая страница уже качается параллельно
  const firstPage = pageFromHash() || 1;
  return (
    <div data-pdf-viewer className="rounded-xl border border-stone-200 bg-stone-100">
      <div className="px-3 py-2 border-b border-stone-200 bg-white rounded-t-xl">{links}</div>
      <div className="px-2 py-3 sm:px-4 sm:py-4">
        <div
          className="mx-auto bg-white shadow-sm ring-1 ring-stone-200 animate-pulse flex items-center justify-center"
          style={{ aspectRatio: PLACEHOLDER_RATIO }}
        >
          <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('pdfViewer.loading')}</span>
        </div>
        <img
          data-preload
          hidden
          aria-hidden="true"
          alt=""
          sizes={PRELOAD_SIZES}
          srcSet={pageSrcSet(pdfUrl, firstPage, PRELOAD_WIDTHS)}
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </div>
  );
};

export default PdfPages;
