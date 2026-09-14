import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { contentAPI, getImageUrl } from '../services/api';
import { makeGetField } from '../utils/getField';
import { formatDate as fmtDate, formatDateRange as fmtDateRange } from '../utils/dates';

const formatTimeRange = (speaker) => {
  if (!speaker.time_start && !speaker.time_end) return '';
  const start = speaker.time_start ? speaker.time_start.substring(0, 5) : '';
  const end = speaker.time_end ? speaker.time_end.substring(0, 5) : '';
  if (start && end) return `${start} – ${end}`;
  return start || end;
};

// Встроенный просмотр PDF — только от брейкпоинта md: Tailwind. На телефонах он
// бесполезен (Android Chrome не рисует PDF в странице, iOS — только первую
// страницу) и лишь тянул бы весь файл, поэтому там не рендерится вовсе.
const WIDE_SCREEN_QUERY = '(min-width: 768px)';

const matchesWideScreen = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia(WIDE_SCREEN_QUERY).matches;

const useIsWideScreen = () => {
  const [isWide, setIsWide] = useState(matchesWideScreen);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(WIDE_SCREEN_QUERY);
    const onChange = () => setIsWide(query.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  return isWide;
};

const CongressProgram = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams();
  const isWideScreen = useIsWideScreen();

  const [congress, setCongress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await contentAPI.getCongressDetail(parseInt(id, 10));
        if (!cancelled) setCongress(res.data);
      } catch (error) {
        console.error('Error loading congress detail:', error);
        if (!cancelled) setCongress(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const L = makeGetField(lang);
  const Lf = (field) => L(congress, field);

  const formatDate = (dateStr) => fmtDate(dateStr, lang);
  const formatDateRange = (startStr, endStr) => fmtDateRange(startStr, endStr, lang);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400" style={{ fontFamily: 'Georgia, serif' }}>{t('common.loading', 'Загрузка...')}</p>
        </div>
      </div>
    );
  }

  if (!congress) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-stone-600 mb-4" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.program.notFound', 'Конгресс не найден')}</p>
          <Link to="/congress" className="text-cyan-600 hover:text-cyan-700" style={{ fontFamily: 'Georgia, serif' }}>
            {t('congress.title', 'Конгресс')}
          </Link>
        </div>
      </div>
    );
  }

  const programDays = congress.program_days || [];
  const allSpeakers = (congress.speakers || []).filter((s) => s.is_active);

  // Спикеры, уже показанные внутри секций, не дублируются в блоке «вне секций».
  const speakerIdsInSections = new Set(
    programDays.flatMap((day) => (day.sections || []).flatMap((section) => (section.speakers || []).map((s) => s.id)))
  );
  const looseSpeakers = allSpeakers.filter((s) => !speakerIdsInSections.has(s.id));

  const programText = Lf('program');
  const programFile = Lf('program_file');
  // Имя для «Скачать» — по языку самого файла (при фолбэке это RU), а не UUID из /uploads
  const programFileName = `program-${congress.id}-${congress[`program_file_${lang}`] ? lang : 'ru'}.pdf`;
  const infoLetterFile = Lf('info_letter_file');
  const hasStructuredProgram = programDays.length > 0 || looseSpeakers.length > 0;
  const hasAnything = hasStructuredProgram || Boolean(programText) || Boolean(programFile) || Boolean(infoLetterFile);

  const renderSpeaker = (speaker) => {
    const fullName = [L(speaker, 'last_name'), L(speaker, 'first_name'), L(speaker, 'patronymic')]
      .filter(Boolean)
      .join(' ');
    const time = formatTimeRange(speaker);
    return (
      <li key={speaker.id} className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
        {speaker.photo_url ? (
          <img src={getImageUrl(speaker.photo_url)} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
            <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {time && <p className="text-xs text-stone-400 mb-1 tabular-nums">{time}</p>}
          <h4 className="text-base md:text-lg text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{fullName}</h4>
          {L(speaker, 'degree') && (
            <p className="text-sm text-amber-900/70" style={{ fontFamily: 'Georgia, serif' }}><em>{L(speaker, 'degree')}</em></p>
          )}
          {L(speaker, 'workplace') && (
            <p className="text-sm text-stone-500 mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>{L(speaker, 'workplace')}</p>
          )}
          {L(speaker, 'topic') && (
            <p className="text-sm text-stone-700 mt-2" style={{ fontFamily: 'Georgia, serif' }}>{L(speaker, 'topic')}</p>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      {/* Header */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('nav.home', 'Главная')}</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to={`/congress/${congress.id}`} className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.title', 'Конгресс')}</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.tabs.program', 'Программа')}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('congress.program.pageTitle', 'Программа конгресса')}
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            {L(congress, 'title')}
          </p>
          {congress.date_start && (
            <p className="mt-3 flex items-center gap-2 text-slate-400">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span style={{ fontFamily: 'Georgia, serif' }}>{formatDateRange(congress.date_start, congress.date_end)}</span>
            </p>
          )}

          <Link
            to={`/congress/${congress.id}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 text-sm text-slate-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
            {t('congress.program.backToCongress', 'Вернуться к конгрессу')}
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-8 sm:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {!hasAnything && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
              <p className="text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.program.empty', 'Программа будет опубликована позже')}</p>
            </div>
          )}

          {/* PDF программы на языке страницы (без перевода — русский файл) */}
          {programFile && (
            <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl md:text-2xl text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('congress.program.pdfTitle', 'Программа конгресса (PDF)')}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={programFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {t('congress.program.pdfOpen', 'Открыть')}
                  </a>
                  <a
                    href={programFile}
                    download={programFileName}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-white text-cyan-700 border border-cyan-500 rounded-xl hover:bg-cyan-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('congress.program.pdfDownload', 'Скачать')}
                  </a>
                </div>
              </div>
              {isWideScreen && (
                <object
                  data={programFile}
                  type="application/pdf"
                  title={t('congress.program.pdfTitle', 'Программа конгресса (PDF)')}
                  className="mt-6 w-full h-[80vh] rounded-xl border border-stone-200 bg-stone-50"
                >
                  <p className="p-6 text-sm text-stone-600" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.program.pdfFallback', 'Браузер не может показать PDF на странице.')}{' '}
                    <a href={programFile} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 underline">
                      {t('congress.program.pdfOpenNewTab', 'Открыть в новой вкладке')}
                    </a>
                  </p>
                </object>
              )}
            </article>
          )}

          {/* Дни → секции → доклады. Все дни развёрнуты, кликать не нужно. */}
          {programDays.map((day) => (
            <article key={day.id} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <header className="mb-6 pb-4 border-b border-stone-200">
                <h2 className="text-xl md:text-2xl text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{L(day, 'title')}</h2>
                {day.date && <p className="text-sm text-stone-500 mt-1" style={{ fontFamily: 'Georgia, serif' }}>{formatDate(day.date)}</p>}
                {L(day, 'description') && (
                  <p className="text-stone-600 mt-3 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>{L(day, 'description')}</p>
                )}
              </header>

              {(day.sections || []).length === 0 ? (
                <p className="text-stone-400 text-sm" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.program.noSections', 'Секции будут добавлены позже')}</p>
              ) : (
                <div className="space-y-8">
                  {(day.sections || []).map((section) => {
                    const speakers = (section.speakers || []).filter((s) => s.is_active);
                    return (
                      <section key={section.id}>
                        <h3 className="text-lg text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{L(section, 'title')}</h3>
                        {L(section, 'description') && (
                          <p className="text-sm text-stone-500 mt-1" style={{ fontFamily: 'Georgia, serif' }}>{L(section, 'description')}</p>
                        )}
                        {speakers.length > 0 ? (
                          <ul className="mt-4 space-y-4">{speakers.map(renderSpeaker)}</ul>
                        ) : (
                          <p className="mt-3 text-stone-400 text-sm" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.program.noSpeakers', 'Спикеры будут добавлены позже')}</p>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </article>
          ))}

          {/* Доклады, не привязанные к секции (сейчас это весь список спикеров в проде). */}
          {looseSpeakers.length > 0 && (
            <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <h2 className="text-xl md:text-2xl text-stone-800 mb-6 pb-4 border-b border-stone-200 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('congress.program.outsideSections', 'Доклады вне секций')}
              </h2>
              <ul className="space-y-4">{looseSpeakers.map(renderSpeaker)}</ul>
            </article>
          )}

          {/* Свободный текст программы из админки */}
          {programText && (
            <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <div
                className="text-stone-600 leading-relaxed prose prose-stone max-w-none"
                style={{ fontFamily: 'Georgia, serif' }}
                dangerouslySetInnerHTML={{ __html: programText.replace(/\n/g, '<br />') }}
              />
            </article>
          )}

          {infoLetterFile && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
              <a
                href={infoLetterFile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {t('congress.program.downloadInfoLetter', 'Информационное письмо (файл)')}
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CongressProgram;
