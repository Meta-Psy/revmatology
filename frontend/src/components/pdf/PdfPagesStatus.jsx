import { useEffect, useState } from 'react';
import { isOwnPdf } from './pdfUrls';
import { checkPdfPages } from './usePdfManifest';

// Сервер рисует PDF не дольше 180 с (design-doc К-08, §5) — опрашиваем чуть дольше
const POLL_MS = 5000;
const MAX_CHECKS = 40;

/**
 * Строка состояния страниц под PDF в админке (UI админки — по-русски, без i18n).
 * Смотрит только статичные файлы по договору §4: manifest.json → готово,
 * .pages.error.json → причина, иначе «Готовятся…» с перепроверкой; если за
 * время опроса страницы так и не появились — «пока не готовы».
 * Внешние ссылки сервер не рисует — для них строки нет.
 */
const PdfPagesStatus = ({ url, saved }) => {
  const own = isOwnPdf(url);
  const [result, setResult] = useState({ url: null, state: 'pending' });

  useEffect(() => {
    if (!own || !saved) return undefined;
    let cancelled = false;
    let timer = null;
    let checks = 0;
    const check = async () => {
      checks += 1;
      const status = await checkPdfPages(url);
      if (cancelled) return;
      if (status.state === 'pending' && checks >= MAX_CHECKS) {
        // опрос окончен, а страниц нет — не обещаем «готовятся» вечно
        setResult({ url, state: 'stalled' });
        return;
      }
      setResult({ url, ...status });
      if (status.state === 'pending') timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [own, saved, url]);

  if (!own) return null;

  if (!saved) {
    return <p className="mt-1 text-xs text-slate-500">Страницы для просмотра на сайте подготовятся после сохранения</p>;
  }

  const status = result.url === url ? result : { state: 'pending' };

  if (status.state === 'ready') {
    const note = status.truncated ? ` (в PDF ${status.pageCount}, на сайте — первые ${status.rendered})` : '';
    return <p className="mt-1 text-xs text-green-700">{`Страницы готовы — ${status.rendered} стр.${note}`}</p>;
  }
  if (status.state === 'error') {
    // сервер перерисовывает только при смене файла — повторное сохранение не поможет
    const message = status.message.replace(/[.\s]+$/, '');
    return <p className="mt-1 text-xs text-red-600">{`Ошибка: ${message}. Загрузите файл заново.`}</p>;
  }
  if (status.state === 'stalled') {
    return <p className="mt-1 text-xs text-amber-700">Страницы пока не готовы — откройте форму позже</p>;
  }
  return <p className="mt-1 text-xs text-slate-500">Готовятся…</p>;
};

export default PdfPagesStatus;
