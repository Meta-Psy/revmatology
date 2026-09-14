import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import PdfPages from '../PdfPages';
import { createTestI18n } from '../../../test/i18n-test-utils';

// ---------------------------------------------------------------------------
// Заглушки браузерных API, которых нет в jsdom
// ---------------------------------------------------------------------------
let observers = [];
class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
    observers.push(this);
  }
  observe(el) { this.elements.add(el); }
  unobserve(el) { this.elements.delete(el); }
  disconnect() { this.elements.clear(); }
}

let areaWidth = 600;
class FakeResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: areaWidth } }]); }
  disconnect() {}
}

const mockMatchMedia = (matches) => {
  window.matchMedia = vi.fn((query) => ({
    matches, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
};

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// Ответы сервера по URL; чего нет в таблице — 404
let routes = {};
const fetchMock = vi.fn(async (url) => (url in routes ? response(200, routes[url]) : response(404)));

const PAGE = { w: 1600, h: 2263 };
const manifest = (count, extra = {}) => ({
  version: 1,
  source: 'doc.pdf',
  page_count: count,
  rendered: count,
  truncated: false,
  widths: [800, 1600],
  pages: Array.from({ length: count }, (_, i) => ({ n: i + 1, ...PAGE })),
  outline: [],
  ...extra,
});

const MANIFEST_URL = '/uploads/doc.pages/manifest.json';

const renderViewer = (props = {}, { lng = 'ru' } = {}) =>
  render(
    <I18nextProvider i18n={createTestI18n(lng)}>
      <PdfPages pdfUrl="/uploads/doc.pdf" title="Положение" downloadName="polozhenie-1-ru.pdf" {...props} />
    </I18nextProvider>
  );

// Картинки страниц на экране (без скрытой предзагрузки)
const pageImages = (container) => [...container.querySelectorAll('img[data-page-img]')];
const pageBox = (container, n) => container.querySelector(`[data-page="${n}"]`);
const pageInput = () => screen.getByLabelText('Номер страницы');
const waitForPages = async (container, count) => {
  await waitFor(() => expect(pageImages(container)).toHaveLength(count));
};

beforeEach(() => {
  observers = [];
  areaWidth = 600;
  routes = {};
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  window.history.replaceState(null, '', '/congress/1/program');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete Element.prototype.scrollIntoView;
  delete window.matchMedia;
  delete document.fullscreenEnabled;
  delete HTMLElement.prototype.requestFullscreen;
});

describe('PdfPages — непрерывный режим', () => {
  it('рисует все страницы: srcSet 800w/1600w, sizes, width/height, eager у первой', async () => {
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();

    await waitForPages(container, 3);
    expect(fetchMock).toHaveBeenCalledWith(MANIFEST_URL, expect.any(Object));

    const [first, second, third] = pageImages(container);
    expect(first).toHaveAttribute(
      'srcset',
      '/uploads/doc.pages/p1-800.webp 800w, /uploads/doc.pages/p1-1600.webp 1600w'
    );
    expect(third).toHaveAttribute(
      'srcset',
      '/uploads/doc.pages/p3-800.webp 800w, /uploads/doc.pages/p3-1600.webp 1600w'
    );
    expect(first).toHaveAttribute('sizes', '600px');
    expect(first).toHaveAttribute('width', '1600');
    expect(first).toHaveAttribute('height', '2263');
    expect(first).toHaveAttribute('alt', 'Положение — страница 1');

    expect(first).toHaveAttribute('loading', 'eager');
    expect(first).toHaveAttribute('fetchpriority', 'high');
    expect(second).toHaveAttribute('loading', 'lazy');
    expect(second).not.toHaveAttribute('fetchpriority');
    expect(third).toHaveAttribute('loading', 'lazy');

    expect(screen.getByText('/ 3')).toBeInTheDocument();
    expect(pageInput()).toHaveValue('1');
  });

  it('масштаб меняет sizes (шаг 25 %, пределы 50–200 %)', async () => {
    routes[MANIFEST_URL] = manifest(2);
    const { container } = renderViewer();
    await waitForPages(container, 2);

    const zoomIn = screen.getByLabelText('Увеличить');
    const zoomOut = screen.getByLabelText('Уменьшить');

    fireEvent.click(zoomIn);
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(pageImages(container)[0]).toHaveAttribute('sizes', '750px');

    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(pageImages(container)[0]).toHaveAttribute('sizes', '300px');
    expect(zoomOut).toBeDisabled();

    for (let i = 0; i < 6; i += 1) fireEvent.click(zoomIn);
    expect(screen.getByText('200%')).toBeInTheDocument();
    expect(pageImages(container)[1]).toHaveAttribute('sizes', '1200px');
    expect(zoomIn).toBeDisabled();
  });

  it('стрелки и поле номера листают к странице', async () => {
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();
    await waitForPages(container, 3);

    expect(screen.getByLabelText('Предыдущая страница')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Следующая страница'));
    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(pageBox(container, 2));
    // соседняя страница — плавно
    expect(Element.prototype.scrollIntoView.mock.calls.at(-1)[0]).toEqual({ behavior: 'smooth', block: 'start' });
    expect(pageInput()).toHaveValue('2');

    fireEvent.change(pageInput(), { target: { value: '3' } });
    fireEvent.keyDown(pageInput(), { key: 'Enter' });
    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(pageBox(container, 3));
    expect(pageInput()).toHaveValue('3');
    expect(screen.getByLabelText('Следующая страница')).toBeDisabled();

    // за пределами документа — последняя страница
    fireEvent.change(pageInput(), { target: { value: '99' } });
    fireEvent.blur(pageInput());
    expect(pageInput()).toHaveValue('3');
  });

  it('текущая страница — по IntersectionObserver, адрес через replaceState(#page=N)', async () => {
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();
    await waitForPages(container, 3);

    const observer = observers.at(-1);
    expect(observer.elements.size).toBe(3);
    const historyLength = window.history.length;

    act(() => observer.callback([
      { target: pageBox(container, 2), isIntersecting: false },
      { target: pageBox(container, 3), isIntersecting: true },
    ]));

    expect(pageInput()).toHaveValue('3');
    expect(window.location.hash).toBe('#page=3');
    expect(window.location.pathname).toBe('/congress/1/program');
    expect(window.history.length).toBe(historyLength);
  });

  it('#page=N при открытии: прокрутка к странице, она грузится сразу', async () => {
    window.history.replaceState(null, '', '/congress/1/program#page=2');
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();
    await waitForPages(container, 3);

    const [, second, third] = pageImages(container);
    expect(second).toHaveAttribute('loading', 'eager');
    expect(second).toHaveAttribute('fetchpriority', 'high');
    expect(third).toHaveAttribute('loading', 'lazy');
    expect(Element.prototype.scrollIntoView.mock.contexts).toContain(pageBox(container, 2));
    // без анимации: плавный проезд подтянул бы lazy-страницы по пути
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
    expect(pageInput()).toHaveValue('2');
  });

  it('truncated — примечание внизу со ссылкой на полный PDF', async () => {
    routes[MANIFEST_URL] = manifest(2, { page_count: 65, truncated: true });
    const { container } = renderViewer();
    await waitForPages(container, 2);

    const note = screen.getByText(/Показаны первые 2 страниц из 65/);
    expect(note).toBeInTheDocument();
    const fullLink = note.closest('p').querySelector('a');
    expect(fullLink).toHaveAttribute('href', '/uploads/doc.pdf');
    expect(fullLink).toHaveAttribute('target', '_blank');
  });

  it('без truncated примечания нет', async () => {
    routes[MANIFEST_URL] = manifest(2);
    const { container } = renderViewer();
    await waitForPages(container, 2);
    expect(screen.queryByText(/Показаны первые/)).not.toBeInTheDocument();
  });
});

describe('PdfPages — кнопки «Открыть PDF» и «Скачать»', () => {
  it('в панели: новая вкладка и осмысленное имя файла', async () => {
    routes[MANIFEST_URL] = manifest(1);
    const { container } = renderViewer();
    await waitForPages(container, 1);

    const open = screen.getByLabelText('Открыть PDF');
    expect(open).toHaveAttribute('href', '/uploads/doc.pdf');
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveAttribute('rel', 'noopener noreferrer');

    const download = screen.getByLabelText('Скачать');
    expect(download).toHaveAttribute('href', '/uploads/doc.pdf');
    expect(download).toHaveAttribute('download', 'polozhenie-1-ru.pdf');
  });

  it('пока манифест грузится — заготовка страницы, первая страница уже запрошена', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    const { container } = renderViewer();

    expect(screen.getByText('Загрузка документа…')).toBeInTheDocument();
    expect(screen.getByLabelText('Открыть PDF')).toBeInTheDocument();
    const preload = container.querySelector('img[data-preload]');
    expect(preload).toHaveAttribute('srcset', expect.stringContaining('/uploads/doc.pages/p1-800.webp 800w'));
    expect(preload).toHaveAttribute('fetchpriority', 'high');
    expect(pageImages(container)).toHaveLength(0);
  });
});

describe('PdfPages — нет страниц', () => {
  it('404 → «Документ готовится к просмотру», Открыть/Скачать и «Повторить»', async () => {
    const { container } = renderViewer();

    expect(await screen.findByText('Документ готовится к просмотру')).toBeInTheDocument();
    expect(screen.getByLabelText('Открыть PDF')).toHaveAttribute('href', '/uploads/doc.pdf');
    expect(screen.getByLabelText('Скачать')).toHaveAttribute('download', 'polozhenie-1-ru.pdf');
    expect(pageImages(container)).toHaveLength(0);

    // страницы дорисовались — «Повторить» их показывает
    routes[MANIFEST_URL] = manifest(2);
    fireEvent.click(screen.getByText('Повторить'));
    await waitForPages(container, 2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Документ готовится к просмотру')).not.toBeInTheDocument();
  });

  it('неизвестная версия манифеста — как 404', async () => {
    routes[MANIFEST_URL] = manifest(2, { version: 2 });
    renderViewer();
    expect(await screen.findByText('Документ готовится к просмотру')).toBeInTheDocument();
  });

  it('сбой сети — как 404', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderViewer();
    expect(await screen.findByText('Документ готовится к просмотру')).toBeInTheDocument();
  });

  it('внешняя ссылка — только кнопки, манифест не запрашивается', async () => {
    const { container } = renderViewer({ pdfUrl: 'https://example.com/files/doc.pdf' });

    expect(screen.getByLabelText('Открыть PDF')).toHaveAttribute('href', 'https://example.com/files/doc.pdf');
    expect(screen.getByLabelText('Скачать')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Документ готовится к просмотру')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('смена файла (язык) — запрашивается новый манифест', async () => {
    routes[MANIFEST_URL] = manifest(1);
    routes['/uploads/doc-uz.pages/manifest.json'] = manifest(2);
    const i18n = createTestI18n('ru');
    const view = (url) => (
      <I18nextProvider i18n={i18n}>
        <PdfPages pdfUrl={url} title="Nizom" downloadName="x.pdf" />
      </I18nextProvider>
    );
    const { container, rerender } = render(view('/uploads/doc.pdf'));
    await waitForPages(container, 1);

    rerender(view('/uploads/doc-uz.pdf'));
    await waitForPages(container, 2);
    expect(pageImages(container)[0]).toHaveAttribute('srcset', expect.stringContaining('/uploads/doc-uz.pages/p1-800.webp'));
  });
});

describe('PdfPages — постраничный режим', () => {
  const openSingle = async () => {
    routes[MANIFEST_URL] = manifest(3);
    const utils = renderViewer();
    await waitForPages(utils.container, 3);
    fireEvent.click(screen.getByLabelText('По одной'));
    return utils;
  };

  const swipe = (el, dx, { dy = 0 } = {}) => {
    fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] });
    fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
  };

  const shownPage = (container) => pageImages(container).map((img) => img.getAttribute('alt'));

  it('одна страница на экране, следующая подгружается заранее, режим запоминается', async () => {
    const { container } = await openSingle();

    expect(shownPage(container)).toEqual(['Положение — страница 1']);
    expect(pageImages(container)[0]).toHaveAttribute('loading', 'eager');
    const preload = container.querySelector('img[data-preload]');
    expect(preload).toHaveAttribute('srcset', expect.stringContaining('/uploads/doc.pages/p2-800.webp'));
    expect(preload).toHaveAttribute('loading', 'eager');
    expect(localStorage.getItem('pdfViewer.mode')).toBe('single');
    expect(screen.getByLabelText('По одной')).toHaveAttribute('aria-pressed', 'true');
  });

  it('клавиши ←/→ и PageUp/PageDown', async () => {
    const { container } = await openSingle();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(shownPage(container)).toEqual(['Положение — страница 2']);
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(shownPage(container)).toEqual(['Положение — страница 3']);
    fireEvent.keyDown(window, { key: 'ArrowRight' }); // дальше некуда
    expect(shownPage(container)).toEqual(['Положение — страница 3']);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'PageUp' });
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
    expect(pageInput()).toHaveValue('1');
  });

  it('клавиши в поле номера страницу не листают', async () => {
    const { container } = await openSingle();
    fireEvent.keyDown(pageInput(), { key: 'ArrowRight' });
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
  });

  it('свайп листает при |dx| > 50, короткий и вертикальный — нет', async () => {
    const { container } = await openSingle();
    const area = container.querySelector('[data-pdf-area]');

    swipe(area, -80);
    expect(shownPage(container)).toEqual(['Положение — страница 2']);
    swipe(area, 80);
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
    swipe(area, -30);
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
    swipe(area, -60, { dy: 200 });
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
  });

  it('щипок (два пальца) — не свайп', async () => {
    const { container } = await openSingle();
    const area = container.querySelector('[data-pdf-area]');

    fireEvent.touchStart(area, { touches: [{ clientX: 200, clientY: 300 }, { clientX: 260, clientY: 300 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 100, clientY: 300 }] });
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
  });

  it('при масштабе больше 100 % свайп выключен', async () => {
    const { container } = await openSingle();
    const area = container.querySelector('[data-pdf-area]');

    fireEvent.click(screen.getByLabelText('Увеличить'));
    swipe(area, -80);
    expect(shownPage(container)).toEqual(['Положение — страница 1']);

    // клавиши и кнопки при этом работают
    fireEvent.click(screen.getByLabelText('Следующая страница'));
    expect(shownPage(container)).toEqual(['Положение — страница 2']);
  });

  it('при повторном открытии режим берётся из localStorage', async () => {
    localStorage.setItem('pdfViewer.mode', 'single');
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();

    await waitForPages(container, 1);
    expect(shownPage(container)).toEqual(['Положение — страница 1']);
  });

  it('недоступный localStorage не ломает просмотр', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SecurityError'); });
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();

    await waitForPages(container, 3);
    fireEvent.click(screen.getByLabelText('По одной'));
    expect(pageImages(container)).toHaveLength(1);
  });

  it('обратно в непрерывный — прокрутка к текущей странице', async () => {
    const { container } = await openSingle();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    Element.prototype.scrollIntoView.mockClear();
    fireEvent.click(screen.getByLabelText('Непрерывно'));

    expect(pageImages(container)).toHaveLength(3);
    expect(Element.prototype.scrollIntoView.mock.contexts).toContain(pageBox(container, 3));
  });
});

describe('PdfPages — полный экран', () => {
  it('без document.fullscreenEnabled (iPhone) кнопки нет', async () => {
    routes[MANIFEST_URL] = manifest(1);
    const { container } = renderViewer();
    await waitForPages(container, 1);
    expect(screen.queryByLabelText('Полный экран')).not.toBeInTheDocument();
  });

  it('есть Fullscreen API — кнопка разворачивает контейнер просмотрщика', async () => {
    document.fullscreenEnabled = true;
    HTMLElement.prototype.requestFullscreen = vi.fn(() => Promise.resolve());
    routes[MANIFEST_URL] = manifest(1);
    const { container } = renderViewer();
    await waitForPages(container, 1);

    fireEvent.click(screen.getByLabelText('Полный экран'));
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(HTMLElement.prototype.requestFullscreen.mock.contexts[0]).toBe(container.querySelector('[data-pdf-viewer]'));
  });
});

describe('PdfPages — оглавление', () => {
  const OUTLINE = [
    { title: 'Введение', page: 1, level: 0, children: [] },
    {
      title: 'Секция 1', page: 2, level: 0,
      children: [{ title: 'Доклад А', page: 3, level: 1, children: [] }],
    },
  ];

  it('без закладок кнопки «Содержание» нет', async () => {
    routes[MANIFEST_URL] = manifest(3);
    const { container } = renderViewer();
    await waitForPages(container, 3);
    expect(screen.queryByLabelText('Содержание')).not.toBeInTheDocument();
  });

  it('на ПК открыто сбоку, подсвечен текущий раздел, клик — переход', async () => {
    mockMatchMedia(true);
    routes[MANIFEST_URL] = manifest(3, { outline: OUTLINE });
    const { container } = renderViewer();
    await waitForPages(container, 3);

    expect(screen.getByLabelText('Содержание')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Введение').closest('button')).toHaveAttribute('aria-current', 'true');

    // прокрутили ко второй странице — подсвечена «Секция 1»
    act(() => observers.at(-1).callback([{ target: pageBox(container, 2), isIntersecting: true }]));
    expect(screen.getByText('Секция 1').closest('button')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Введение').closest('button')).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByText('Доклад А'));
    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(pageBox(container, 3));
    expect(screen.getByText('Доклад А').closest('button')).toHaveAttribute('aria-current', 'true');
    // на ПК панель остаётся открытой
    expect(screen.getByText('Доклад А')).toBeInTheDocument();
  });

  it('на телефоне выдвигается по кнопке и закрывается после перехода', async () => {
    mockMatchMedia(false);
    routes[MANIFEST_URL] = manifest(3, { outline: OUTLINE });
    const { container } = renderViewer();
    await waitForPages(container, 3);

    const toggle = screen.getByLabelText('Содержание');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Доклад А')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByText('Доклад А'));

    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(pageBox(container, 3));
    // через страницу — сразу, без анимации
    expect(Element.prototype.scrollIntoView.mock.calls.at(-1)[0]).toEqual({ behavior: 'instant', block: 'start' });
    expect(screen.queryByText('Доклад А')).not.toBeInTheDocument();
    expect(pageInput()).toHaveValue('3');
  });
});

describe('PdfPages — языки', () => {
  it('подписи на узбекском', async () => {
    routes[MANIFEST_URL] = manifest(1);
    const { container } = renderViewer({}, { lng: 'uz' });
    await waitForPages(container, 1);
    expect(screen.getByLabelText('PDF ochish')).toBeInTheDocument();
    expect(screen.getByLabelText('Yuklab olish')).toBeInTheDocument();
  });
});
