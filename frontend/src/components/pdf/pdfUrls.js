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
const OWN_PDF = /^\/uploads\/[^/?#]+\.pdf$/;

export const isOwnPdf = (url) => typeof url === 'string' && OWN_PDF.test(url);

const pagesDir = (pdfUrl) => pdfUrl.replace(/\.pdf$/, '.pages');

export const manifestUrl = (pdfUrl) => `${pagesDir(pdfUrl)}/manifest.json`;

export const errorUrl = (pdfUrl) => `${pagesDir(pdfUrl)}.error.json`;

export const pageImageUrl = (pdfUrl, n, width) => `${pagesDir(pdfUrl)}/p${n}-${width}.webp`;

export const pageSrcSet = (pdfUrl, n, widths) =>
  widths.map((w) => `${pageImageUrl(pdfUrl, n, w)} ${w}w`).join(', ');
