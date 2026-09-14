/**
 * Пути к страницам PDF по договору сервер ↔ фронт (design-doc К-08, §4).
 *
 * Для `/uploads/<name>.pdf` сервер кладёт рядом:
 *   /uploads/<name>.pages/manifest.json   — появляется последним
 *   /uploads/<name>.pages/p<N>-<w>.webp   — N = 1..rendered, w из manifest.widths
 *   /uploads/<name>.pages.error.json      — только при неудаче
 * Страницы рисуются только для нашего каталога и только для `.pdf`
 * (сервер сохраняет расширение в нижнем регистре); внешние ссылки не трогаются.
 */
// Тот же набор символов, что пропускает сервер: без \, %, пробелов и прочего
const OWN_PDF = /^\/uploads\/[A-Za-z0-9._-]+\.pdf$/;

export const isOwnPdf = (url) => typeof url === 'string' && OWN_PDF.test(url);

const pagesDir = (pdfUrl) => pdfUrl.replace(/\.pdf$/, '.pages');

export const manifestUrl = (pdfUrl) => `${pagesDir(pdfUrl)}/manifest.json`;

export const errorUrl = (pdfUrl) => `${pagesDir(pdfUrl)}.error.json`;

export const pageImageUrl = (pdfUrl, n, width) => `${pagesDir(pdfUrl)}/p${n}-${width}.webp`;

/**
 * srcSet страницы. pageWidth — manifest.pages[].w, ширина самой крупной версии:
 * у очень высоких страниц сервер ограничивает высоту, и ширина выходит меньше
 * номинальной — дескрипторы тогда пропорционально меньше. Без pageWidth
 * (манифеста ещё нет) — номинальные ширины.
 */
export const pageSrcSet = (pdfUrl, n, widths, pageWidth) => {
  const largest = Math.max(...widths);
  return widths
    .map((w) => `${pageImageUrl(pdfUrl, n, w)} ${pageWidth ? Math.round((pageWidth * w) / largest) : w}w`)
    .join(', ');
};
