import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI, getImageUrl } from '../services/api';

const History = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getHistory();
      const items = Array.isArray(res.data) ? res.data : [];
      // Sort by year ascending
      items.sort((a, b) => (a.year || 0) - (b.year || 0));
      setHistoryItems(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400" style={{ fontFamily: 'Georgia, serif' }}>
            {lang === 'ru' ? 'Загрузка...' : lang === 'uz' ? 'Yuklanmoqda...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Corner accents */}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-sky-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-sky-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-blue-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-blue-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
              {t('nav.home', 'Главная')}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>
              {t('historyPage.title', 'История ассоциации')}
            </span>
          </nav>

          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-sky-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                {t('historyPage.title', 'История ассоциации')}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {t('historyPage.subtitle', 'Ключевые этапы развития Ассоциации ревматологов Узбекистана')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>

        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {historyItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                {t('historyPage.noData', 'История ассоциации будет добавлена в ближайшее время')}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-sky-400/40 via-blue-400/20 to-transparent"></div>

              <div className="space-y-10 sm:space-y-14">
                {historyItems.map((item, index) => (
                  <div key={item.id} className="relative pl-16 sm:pl-20">
                    {/* Year badge */}
                    <div className="absolute left-0 top-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-700/50 z-10">
                      <span className="text-sky-400 text-sm sm:text-base font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                        {item.year || '---'}
                      </span>
                    </div>

                    {/* Timeline dot connector */}
                    <div className="absolute left-[23px] sm:left-[31px] top-6 sm:top-8 w-2 h-2 rounded-full bg-sky-400 ring-4 ring-stone-50 z-10"></div>

                    {/* Content card */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60 hover:shadow-lg hover:border-stone-300 transition-all duration-300">
                      {/* Title */}
                      <h3 className="text-lg md:text-xl text-stone-800 mb-3 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {getField(item, 'title')}
                      </h3>

                      {/* Separator */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-px bg-gradient-to-r from-sky-400/50 to-transparent"></div>
                        <div className="w-1 h-1 rotate-45 bg-sky-400/50"></div>
                      </div>

                      {/* Content as HTML */}
                      {getField(item, 'content') && (
                        <div
                          className="prose prose-stone prose-sm max-w-none mb-4 text-stone-600 leading-relaxed"
                          style={{ fontFamily: 'Georgia, serif' }}
                          dangerouslySetInnerHTML={{ __html: (getField(item, 'content') || '').replace(/\n/g, '<br />') }}
                        />
                      )}

                      {/* Optional image */}
                      {item.image_url && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-stone-200">
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={getField(item, 'title')}
                            className="w-full h-auto object-cover max-h-[300px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline end dot */}
              <div className="absolute left-[23px] sm:left-[31px] bottom-0 w-3 h-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 ring-4 ring-stone-50"></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default History;
