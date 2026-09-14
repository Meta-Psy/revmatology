import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { makeGetField } from '../utils/getField';
import { formatDateRange as fmtDateRange } from '../utils/dates';
import PdfPages from '../components/pdf/PdfPages';

/** Конкурс молодых учёных: текст из админки и положение конкурса (PDF страницами). */
const CongressYoungScientists = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams();

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
  const pageTitle = t('congress.youngScientists.pageTitle', 'Конкурс молодых учёных');

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

  const text = L(congress, 'young_scientists');
  const file = L(congress, 'young_scientists_file');
  // Имя для «Скачать» — по языку самого файла (при фолбэке это RU), а не UUID из /uploads
  const downloadName = `polozhenie-konkursa-${congress.id}-${congress[`young_scientists_file_${lang}`] ? lang : 'ru'}.pdf`;

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
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to={`/congress/${congress.id}`} className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.title', 'Конгресс')}</Link>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>{pageTitle}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {pageTitle}
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            {L(congress, 'title')}
          </p>
          {congress.date_start && (
            <p className="mt-3 flex items-center gap-2 text-slate-400">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span style={{ fontFamily: 'Georgia, serif' }}>{fmtDateRange(congress.date_start, congress.date_end, lang)}</span>
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

      {/* Content. overflow-clip, а не hidden: иначе панель просмотра PDF не залипает (sticky) */}
      <section className="relative py-8 sm:py-12 overflow-clip">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {!text && !file && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
              <p className="text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.youngScientists.empty', 'Информация будет опубликована позже')}</p>
            </div>
          )}

          {/* Текст из админки — так же, как во вкладке конгресса. Идёт первым:
              на телефоне иначе условия уходят под 10–20 страниц положения */}
          {text && (
            <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <div
                className="text-stone-600 leading-relaxed prose prose-stone max-w-none"
                style={{ fontFamily: 'Georgia, serif' }}
                dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }}
              />
            </article>
          )}

          {/* Положение конкурса на языке страницы (без перевода — русский файл) */}
          {file && (
            <article className="bg-white rounded-2xl px-3 py-5 sm:p-6 md:p-8 shadow-sm border border-stone-200/60">
              <h2 className="px-1 sm:px-0 mb-4 text-xl md:text-2xl text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('congress.youngScientists.regulationsPdf', 'Положение конкурса (PDF)')}
              </h2>
              <PdfPages
                pdfUrl={file}
                title={t('congress.youngScientists.regulations', 'Положение конкурса')}
                downloadName={downloadName}
              />
            </article>
          )}
        </div>
      </section>
    </div>
  );
};

export default CongressYoungScientists;
