import { describe, it, expect, afterEach, vi } from 'vitest';

import { isOwnPdf, manifestUrl, errorUrl, pageImageUrl, pageSrcSet } from '../pdfUrls';
import { validateManifest, loadManifest, checkPdfPages } from '../usePdfManifest';

// ---------------------------------------------------------------------------
// Пути по договору §4: всё лежит рядом с PDF, имена выводятся из имени файла
// ---------------------------------------------------------------------------
describe('pdfUrls', () => {
  it('свой PDF — только /uploads/<name>.pdf', () => {
    expect(isOwnPdf('/uploads/3f2a.pdf')).toBe(true);
    expect(isOwnPdf('https://example.com/uploads/3f2a.pdf')).toBe(false);
    expect(isOwnPdf('/uploads/sub/3f2a.pdf')).toBe(false);
    expect(isOwnPdf('/uploads/3f2a.docx')).toBe(false);
    expect(isOwnPdf('/static/3f2a.pdf')).toBe(false);
    expect(isOwnPdf('/uploads/3f2a.pdf?x=1')).toBe(false);
    expect(isOwnPdf('')).toBe(false);
    expect(isOwnPdf(null)).toBe(false);
    // как на сервере: только буквы, цифры, точка, _ и -
    expect(isOwnPdf('/uploads/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed.pdf')).toBe(true);
    expect(isOwnPdf('/uploads/a\\b.pdf')).toBe(false);
    expect(isOwnPdf('/uploads/a%2F..%2Fb.pdf')).toBe(false);
    expect(isOwnPdf('/uploads/a b.pdf')).toBe(false);
  });

  it('манифест, файл ошибки и картинки страниц', () => {
    expect(manifestUrl('/uploads/doc.pdf')).toBe('/uploads/doc.pages/manifest.json');
    expect(errorUrl('/uploads/doc.pdf')).toBe('/uploads/doc.pages.error.json');
    expect(pageImageUrl('/uploads/doc.pdf', 3, 800)).toBe('/uploads/doc.pages/p3-800.webp');
    expect(pageSrcSet('/uploads/doc.pdf', 2, [800, 1600])).toBe(
      '/uploads/doc.pages/p2-800.webp 800w, /uploads/doc.pages/p2-1600.webp 1600w'
    );
    // w страницы — ширина версии 1600; у очень высоких страниц она меньше
    expect(pageSrcSet('/uploads/doc.pdf', 2, [800, 1600], 1600)).toBe(
      '/uploads/doc.pages/p2-800.webp 800w, /uploads/doc.pages/p2-1600.webp 1600w'
    );
    expect(pageSrcSet('/uploads/doc.pdf', 2, [800, 1600], 1001)).toBe(
      '/uploads/doc.pages/p2-800.webp 501w, /uploads/doc.pages/p2-1600.webp 1001w'
    );
  });
});

const MANIFEST = {
  version: 1,
  source: 'doc.pdf',
  page_count: 2,
  rendered: 2,
  truncated: false,
  widths: [800, 1600],
  pages: [{ n: 1, w: 1600, h: 2263 }, { n: 2, w: 1600, h: 2263 }],
  outline: [],
};

describe('validateManifest', () => {
  it('принимает манифест версии 1', () => {
    const m = validateManifest(MANIFEST);
    expect(m.pages).toHaveLength(2);
    expect(m.widths).toEqual([800, 1600]);
    expect(m.rendered).toBe(2);
    expect(m.outline).toEqual([]);
  });

  it('другая версия, пустые страницы или мусор — null', () => {
    expect(validateManifest({ ...MANIFEST, version: 2 })).toBeNull();
    expect(validateManifest({ ...MANIFEST, pages: [] })).toBeNull();
    expect(validateManifest({ ...MANIFEST, widths: [] })).toBeNull();
    expect(validateManifest('<!doctype html>')).toBeNull();
    expect(validateManifest(null)).toBeNull();
  });

  it('без outline — пустое оглавление', () => {
    const { outline: _omit, ...rest } = MANIFEST;
    expect(validateManifest(rest).outline).toEqual([]);
  });

  it('оглавление: негодные пункты выбрасываются, вложенные — тоже проверяются', () => {
    const ok = (title, page, children = []) => ({ title, page, level: 0, children });
    const m = validateManifest({
      ...MANIFEST,
      outline: [
        ok('Введение', 1),
        ok('Секция', 2, [
          ok('Доклад', 2),
          ok('За пределами', 3), // rendered = 2
          { title: 'Без детей', page: 2, level: 1 },
        ]),
        ok({ html: '<b>' }, 1),
        ok('Ноль', 0),
        ok('Дробная', 1.5),
        ok('Строка', '2'),
        { title: 'Дети не массив', page: 1, level: 0, children: 'x' },
        null,
      ],
    });
    expect(m.outline).toEqual([
      ok('Введение', 1),
      ok('Секция', 2, [ok('Доклад', 2)]),
    ]);
  });
});

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (body === undefined) throw new SyntaxError('Unexpected token <');
    return body;
  },
});

describe('loadManifest / checkPdfPages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loadManifest: 200 → манифест, 404 / не JSON / сеть → null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(200, MANIFEST)));
    expect((await loadManifest('/uploads/doc.pdf')).pages).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith('/uploads/doc.pages/manifest.json', expect.any(Object));

    vi.stubGlobal('fetch', vi.fn(async () => response(404)));
    expect(await loadManifest('/uploads/doc.pdf')).toBeNull();

    vi.stubGlobal('fetch', vi.fn(async () => response(200)));
    expect(await loadManifest('/uploads/doc.pdf')).toBeNull();

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network'); }));
    expect(await loadManifest('/uploads/doc.pdf')).toBeNull();
  });

  it('checkPdfPages: готово / ошибка / готовится', async () => {
    const routes = {};
    vi.stubGlobal('fetch', vi.fn(async (url) => (url in routes ? response(200, routes[url]) : response(404))));

    expect(await checkPdfPages('/uploads/doc.pdf')).toEqual({ state: 'pending' });

    routes['/uploads/doc.pages.error.json'] = {
      version: 1, source: 'doc.pdf', error: 'encrypted', message: 'Файл защищён паролем',
    };
    expect(await checkPdfPages('/uploads/doc.pdf')).toEqual({ state: 'error', message: 'Файл защищён паролем' });

    routes['/uploads/doc.pages/manifest.json'] = { ...MANIFEST, page_count: 65, rendered: 2, truncated: true };
    expect(await checkPdfPages('/uploads/doc.pdf')).toEqual({
      state: 'ready', rendered: 2, pageCount: 65, truncated: true,
    });
  });
});
