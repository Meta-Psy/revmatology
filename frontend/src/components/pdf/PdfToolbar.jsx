import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, ChevronRight, Download, ExternalLink, File, GalleryVertical,
  List, Maximize, Minimize, Minus, Plus,
} from 'lucide-react';

const ICON = 'w-4 h-4 shrink-0';
const TOOL_BTN =
  'inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2 rounded-lg text-sm text-stone-600 ' +
  'hover:bg-stone-100 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:pointer-events-none';

/**
 * «Открыть PDF» (оригинал, новая вкладка) и «Скачать» (с осмысленным именем
 * вместо UUID из /uploads). compact — значки в панели, подписи только на
 * широком экране; иначе — крупные кнопки для состояний без страниц.
 */
export const PdfFileLinks = ({ pdfUrl, downloadName, compact = false }) => {
  const { t } = useTranslation();
  const label = compact ? 'hidden md:inline' : '';
  const primary = compact
    ? `${TOOL_BTN} text-cyan-700 hover:text-cyan-800`
    : 'inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors';
  const secondary = compact
    ? TOOL_BTN
    : 'inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-white text-cyan-700 border border-cyan-500 rounded-xl hover:bg-cyan-50 transition-colors';

  return (
    <>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('pdfViewer.open')}
        title={t('pdfViewer.open')}
        className={primary}
      >
        <ExternalLink className={ICON} aria-hidden="true" />
        <span className={label}>{t('pdfViewer.open')}</span>
      </a>
      <a
        href={pdfUrl}
        download={downloadName || true}
        aria-label={t('pdfViewer.download')}
        title={t('pdfViewer.download')}
        className={secondary}
      >
        <Download className={ICON} aria-hidden="true" />
        <span className={label}>{t('pdfViewer.download')}</span>
      </a>
    </>
  );
};

/** Поле номера страницы: черновик живёт, пока его редактируют; Enter/уход — переход. */
const PageInput = ({ current, total, onGoTo }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(null);

  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) onGoTo(n);
    setDraft(null);
  };

  return (
    <span className="inline-flex items-center gap-1 text-sm text-stone-500 tabular-nums">
      <input
        type="text"
        inputMode="numeric"
        aria-label={t('pdfViewer.pageNumber')}
        value={draft ?? String(current)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          else if (e.key === 'Escape') setDraft(null);
        }}
        className="w-11 h-8 px-1 text-center text-stone-800 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <span className="whitespace-nowrap">/ {total}</span>
    </span>
  );
};

/** Закреплённая панель просмотра: содержание, страницы, масштаб, режим, полный экран, файл. */
const PdfToolbar = ({
  className = '',
  current, total, onGoTo,
  zoom, onZoomIn, onZoomOut, canZoomIn, canZoomOut,
  mode, onModeChange,
  hasOutline, outlineOpen, onToggleOutline,
  canFullscreen, isFullscreen, onToggleFullscreen,
  pdfUrl, downloadName,
}) => {
  const { t } = useTranslation();
  const modeBtn = (active) =>
    `inline-flex items-center justify-center gap-1.5 h-8 min-w-8 px-2 rounded-md text-sm transition-colors ${
      active ? 'bg-white text-cyan-700 shadow-sm' : 'text-stone-500 hover:text-stone-800'
    }`;

  return (
    <div
      role="toolbar"
      aria-label={t('pdfViewer.toolbar')}
      className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1.5 sm:px-3 bg-white/95 backdrop-blur border-b border-stone-200 rounded-t-xl ${className}`}
    >
      <div className="flex items-center gap-1">
        {hasOutline && (
          <button
            type="button"
            onClick={onToggleOutline}
            aria-label={t('pdfViewer.outline')}
            aria-expanded={outlineOpen}
            title={t('pdfViewer.outline')}
            className={`${TOOL_BTN} ${outlineOpen ? 'bg-cyan-50 text-cyan-700' : ''}`}
          >
            <List className={ICON} aria-hidden="true" />
            <span className="hidden md:inline">{t('pdfViewer.outline')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onGoTo(current - 1)}
          disabled={current <= 1}
          aria-label={t('pdfViewer.prevPage')}
          title={t('pdfViewer.prevPage')}
          className={TOOL_BTN}
        >
          <ChevronLeft className={ICON} aria-hidden="true" />
        </button>
        <PageInput current={current} total={total} onGoTo={onGoTo} />
        <button
          type="button"
          onClick={() => onGoTo(current + 1)}
          disabled={current >= total}
          aria-label={t('pdfViewer.nextPage')}
          title={t('pdfViewer.nextPage')}
          className={TOOL_BTN}
        >
          <ChevronRight className={ICON} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          aria-label={t('pdfViewer.zoomOut')}
          title={t('pdfViewer.zoomOut')}
          className={TOOL_BTN}
        >
          <Minus className={ICON} aria-hidden="true" />
        </button>
        <span className="w-11 text-center text-sm text-stone-600 tabular-nums">{zoom}%</span>
        <button
          type="button"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          aria-label={t('pdfViewer.zoomIn')}
          title={t('pdfViewer.zoomIn')}
          className={TOOL_BTN}
        >
          <Plus className={ICON} aria-hidden="true" />
        </button>

        <div role="group" aria-label={t('pdfViewer.viewMode')} className="flex p-0.5 mx-1 bg-stone-100 rounded-lg">
          <button
            type="button"
            onClick={() => onModeChange('continuous')}
            aria-pressed={mode === 'continuous'}
            aria-label={t('pdfViewer.continuous')}
            title={t('pdfViewer.continuous')}
            className={modeBtn(mode === 'continuous')}
          >
            <GalleryVertical className={ICON} aria-hidden="true" />
            <span className="hidden lg:inline">{t('pdfViewer.continuous')}</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('single')}
            aria-pressed={mode === 'single'}
            aria-label={t('pdfViewer.single')}
            title={t('pdfViewer.single')}
            className={modeBtn(mode === 'single')}
          >
            <File className={ICON} aria-hidden="true" />
            <span className="hidden lg:inline">{t('pdfViewer.single')}</span>
          </button>
        </div>

        {canFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? t('pdfViewer.exitFullscreen') : t('pdfViewer.fullscreen')}
            title={isFullscreen ? t('pdfViewer.exitFullscreen') : t('pdfViewer.fullscreen')}
            className={TOOL_BTN}
          >
            {isFullscreen
              ? <Minimize className={ICON} aria-hidden="true" />
              : <Maximize className={ICON} aria-hidden="true" />}
          </button>
        )}

        <PdfFileLinks pdfUrl={pdfUrl} downloadName={downloadName} compact />
      </div>
    </div>
  );
};

export default PdfToolbar;
