import { useCallback, useEffect, useState } from 'react';
import { errorUrl, isOwnPdf, manifestUrl } from './pdfUrls';

const MANIFEST_VERSION = 1;

/**
 * Проверяет manifest.json (версия 1, §4). Всё, что не похоже на манифест
 * (другая версия, пустые страницы, HTML вместо JSON), — null: такой документ
 * показывается кнопками «Открыть/Скачать», а не ломает страницу.
 */
export const validateManifest = (data) => {
  if (!data || typeof data !== 'object' || data.version !== MANIFEST_VERSION) return null;
  const pages = Array.isArray(data.pages)
    ? data.pages.filter((p) => Number.isInteger(p?.n) && p.n >= 1 && p.w > 0 && p.h > 0)
    : [];
  const widths = Array.isArray(data.widths) ? data.widths.filter((w) => Number.isInteger(w) && w > 0) : [];
  if (pages.length === 0 || widths.length === 0) return null;
  return {
    ...data,
    pages,
    widths,
    rendered: pages.length,
    page_count: Number.isInteger(data.page_count) ? data.page_count : pages.length,
    truncated: data.truncated === true,
    outline: Array.isArray(data.outline) ? data.outline : [],
  };
};

// JSON по ссылке; 404, сбой сети или не-JSON — null. Отмену (AbortError) пробрасываем.
const fetchJson = async (url, init) => {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
};

export const loadManifest = async (pdfUrl, init = {}) =>
  validateManifest(await fetchJson(manifestUrl(pdfUrl), init));

/**
 * Состояние страниц для админки: готовы / ошибка рисования / ещё готовятся.
 * `no-store` — статус опрашивается повторно, ответ не должен залипать в кэше.
 */
export const checkPdfPages = async (pdfUrl) => {
  const manifest = await loadManifest(pdfUrl, { cache: 'no-store' });
  if (manifest) {
    return {
      state: 'ready',
      rendered: manifest.rendered,
      pageCount: manifest.page_count,
      truncated: manifest.truncated,
    };
  }
  const error = await fetchJson(errorUrl(pdfUrl), { cache: 'no-store' });
  if (error && typeof error.message === 'string') return { state: 'error', message: error.message };
  return { state: 'pending' };
};

/**
 * Манифест страниц для публичного просмотра.
 * status: 'external' (не наш PDF — только кнопки), 'loading', 'ready', 'error'.
 * Состояние привязано к ключу «файл + попытка»: пока ответ не пришёл для
 * текущего ключа, это 'loading' — без синхронного setState в эффекте.
 */
export const usePdfManifest = (pdfUrl) => {
  const own = isOwnPdf(pdfUrl);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, manifest: null });
  const key = `${pdfUrl}|${attempt}`;

  useEffect(() => {
    if (!own) return undefined;
    const controller = new AbortController();
    loadManifest(pdfUrl, { signal: controller.signal }).then(
      (manifest) => setResult({ key, manifest }),
      () => {} // отменено: файл сменился или просмотр закрыт
    );
    return () => controller.abort();
  }, [own, pdfUrl, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!own) return { status: 'external', manifest: null, retry };
  if (result.key !== key) return { status: 'loading', manifest: null, retry };
  return { status: result.manifest ? 'ready' : 'error', manifest: result.manifest, retry };
};
