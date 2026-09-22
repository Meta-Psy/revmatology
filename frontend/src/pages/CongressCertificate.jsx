import { useState, useEffect, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { contentAPI, readBlobError, filenameFromDisposition } from '../services/api';

const SUGGEST_DELAY_MS = 300;
const SUGGEST_MIN_CHARS = 3;

const serif = { fontFamily: 'Georgia, serif' };

// Код ответа выдачи → ключ локали. Статус главнее кода: 404 одинаков для всех причин.
const errorKey = (status, code) => {
  if (status === 404 || code === 'not_found') return 'certificate.notFound';
  if (status === 403 || code === 'limit_reached') return 'certificate.limitReached';
  if (status === 429 || code === 'too_many_requests') return 'certificate.tooMany';
  return 'certificate.error';
};

/**
 * Именной сертификат участника (К-11): участник выбирает себя из подсказок по Ф.И.О.,
 * при необходимости подтверждает телефоном и скачивает PDF. Своё имя ввести нельзя —
 * на сертификат идёт официальное Ф.И.О. из списка.
 */
const CongressCertificate = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const congressId = parseInt(id, 10);
  const listId = useId();

  const [status, setStatus] = useState('loading'); // loading | open | closed | error
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [searched, setSearched] = useState(false); // подсказки по текущему тексту уже пришли
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [certificate, setCertificate] = useState(null); // { blob, filename }
  const requestSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    contentAPI.getCertificateStatus(congressId)
      .then((res) => { if (!cancelled) setStatus(res.data?.open ? 'open' : 'closed'); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [congressId]);

  // Подсказки: от 3 непробельных символов, с задержкой; выбранное имя не переспрашиваем
  useEffect(() => {
    if (selected) return undefined;
    const seq = ++requestSeq.current;
    if (query.replace(/\s/g, '').length < SUGGEST_MIN_CHARS) {
      setOptions([]);
      setSearched(false);
      setListOpen(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await contentAPI.suggestCertificateRecipients(congressId, query);
        if (seq !== requestSeq.current) return; // пришёл ответ на устаревший текст
        const list = (res.data || []).map(({ id: rid, full_name, needs_phone }) => ({ id: rid, full_name, needs_phone }));
        setOptions(list);
        setActiveIndex(-1);
        setListOpen(list.length > 0);
      } catch {
        if (seq !== requestSeq.current) return;
        setOptions([]);
        setListOpen(false);
      }
      setSearched(true);
    }, SUGGEST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, selected, congressId]);

  const choose = (option) => {
    setSelected(option);
    setQuery(option.full_name);
    setListOpen(false);
    setActiveIndex(-1);
    setErrorText('');
    setCertificate(null);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setSelected(null);
    setSearched(false);
    setErrorText('');
    setCertificate(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (options.length === 0) return;
      e.preventDefault();
      if (!listOpen) {
        setListOpen(true);
        setActiveIndex(e.key === 'ArrowDown' ? 0 : options.length - 1);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
    } else if (e.key === 'Enter') {
      if (listOpen && activeIndex >= 0) {
        e.preventDefault();
        choose(options[activeIndex]);
      } else if (!selected) {
        e.preventDefault(); // без выбора из списка форма не уходит
      }
    } else if (e.key === 'Escape') {
      setListOpen(false);
      setActiveIndex(-1);
    }
  };

  const needsPhone = !!selected?.needs_phone;
  const canSubmit = !!selected && (!needsPhone || phone.replace(/\D/g, '').length > 0) && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorText('');
    setCertificate(null);
    try {
      const res = await contentAPI.issueCertificate(congressId, {
        recipient_id: selected.id,
        phone: needsPhone ? phone : null,
      });
      setCertificate({ blob: res.data, filename: filenameFromDisposition(res.headers?.['content-disposition']) });
    } catch (err) {
      const code = await readBlobError(err);
      setErrorText(t(errorKey(err?.response?.status, code)));
    } finally {
      setSubmitting(false);
    }
  };

  // Скачивание из памяти: PDF уже получен, повторный запрос съел бы ещё одну выдачу
  const handleDownload = () => {
    const url = URL.createObjectURL(certificate.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = certificate.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const title = t('certificate.title');
  const showNoMatches = !selected && searched && options.length === 0;
  const optionId = (i) => `${listId}-opt-${i}`;

  const inputClass = 'w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-colors';

  return (
    <div>
      {/* Header */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={serif}>{t('nav.home', 'Главная')}</Link>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to={`/congress/${id}`} className="hover:text-white transition-colors" style={serif}>{t('congress.title', 'Конгресс')}</Link>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-white" style={serif}>{title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {title}
          </h1>

          <Link
            to={`/congress/${id}`}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-slate-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            style={serif}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
            {t('congress.program.backToCongress', 'Вернуться к конгрессу')}
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {status === 'loading' && (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" aria-label={t('common.loading', 'Загрузка...')}></div>
            </div>
          )}

          {(status === 'closed' || status === 'error') && (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-stone-200/60 text-center">
              <p className="text-stone-500" style={serif}>
                {t(status === 'closed' ? 'certificate.closed' : 'certificate.error')}
              </p>
            </div>
          )}

          {status === 'open' && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60 space-y-5">
              <p className="text-stone-600" style={serif}>{t('certificate.instruction')}</p>

              <div className="relative">
                <label htmlFor={`${listId}-name`} className="block text-sm text-stone-700 mb-1.5" style={serif}>
                  {t('certificate.nameLabel')}
                </label>
                <input
                  id={`${listId}-name`}
                  type="text"
                  role="combobox"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={listOpen}
                  aria-controls={`${listId}-list`}
                  aria-activedescendant={listOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                  aria-describedby={`${listId}-hint`}
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setListOpen(false)}
                  className={inputClass}
                  style={serif}
                />
                <p id={`${listId}-hint`} className="mt-1 text-xs text-stone-400" style={serif}>{t('certificate.pickHint')}</p>

                {listOpen && (
                  <ul
                    id={`${listId}-list`}
                    role="listbox"
                    className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    {options.map((option, i) => (
                      <li
                        key={option.id}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === activeIndex}
                        // mousedown, а не click: иначе blur поля закроет список раньше выбора
                        onMouseDown={(e) => { e.preventDefault(); choose(option); }}
                        className={`px-4 py-2.5 cursor-pointer text-stone-800 ${i === activeIndex ? 'bg-cyan-50' : 'hover:bg-stone-50'}`}
                        style={serif}
                      >
                        {option.full_name}
                      </li>
                    ))}
                  </ul>
                )}
                {showNoMatches && (
                  <p className="mt-2 text-sm text-stone-500" style={serif}>{t('certificate.noMatches')}</p>
                )}
              </div>

              {needsPhone && (
                <div>
                  <label htmlFor={`${listId}-phone`} className="block text-sm text-stone-700 mb-1.5" style={serif}>
                    {t('certificate.phoneLabel')}
                  </label>
                  <input
                    id={`${listId}-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrorText(''); }}
                    placeholder="+998"
                    className={inputClass}
                    style={serif}
                  />
                  <p className="mt-1 text-xs text-stone-400" style={serif}>{t('certificate.phoneHint')}</p>
                </div>
              )}

              {errorText && (
                <p role="alert" className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" style={serif}>
                  {errorText}
                </p>
              )}

              {certificate ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-stone-700" style={serif}>{t('certificate.ready')}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-500 transition-all"
                    style={serif}
                  >
                    {t('certificate.download')}
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={serif}
                >
                  {t('certificate.find')}
                </button>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default CongressCertificate;
