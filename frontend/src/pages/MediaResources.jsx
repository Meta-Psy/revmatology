import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const MediaResources = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('journal');

  const tabs = [
    { key: 'journal', label: t('mediaResourcesPage.journals', 'Журналы') },
    { key: 'article', label: t('mediaResourcesPage.articles', 'Статьи') },
    { key: 'book', label: t('mediaResourcesPage.books', 'Книги') },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getMediaResources();
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading media resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const filteredResources = resources.filter(r => r.resource_type === activeTab);

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
              {t('mediaResourcesPage.title', 'Медиаресурсы')}
            </span>
          </nav>

          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-sky-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                {t('mediaResourcesPage.title', 'Медиаресурсы')}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {t('mediaResourcesPage.subtitle', 'Журналы, статьи и книги по ревматологии')}
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-sky-300 hover:text-sky-700 shadow-sm'
                }`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resources grid */}
          {filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                {t('mediaResourcesPage.noResources', 'Ресурсы пока не добавлены')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-stone-200/60 hover:shadow-lg hover:border-stone-300 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Cover image */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-stone-200">
                    {resource.cover_image_url ? (
                      <img
                        src={`http://localhost:8000${resource.cover_image_url}`}
                        alt={getField(resource, 'title')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                        <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-base text-stone-800 mb-2 leading-snug line-clamp-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {getField(resource, 'title')}
                    </h3>

                    {/* Author */}
                    {getField(resource, 'author') && (
                      <p className="text-sky-700/70 text-sm mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        <em>{getField(resource, 'author')}</em>
                      </p>
                    )}

                    {/* Description */}
                    {getField(resource, 'description') && (
                      <p className="text-stone-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow" style={{ fontFamily: 'Georgia, serif' }}>
                        {getField(resource, 'description')}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-auto">
                      {resource.file_url && (
                        <a
                          href={`http://localhost:8000${resource.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>{t('mediaResourcesPage.download', 'Скачать')}</span>
                        </a>
                      )}
                      {resource.external_url && (
                        <a
                          href={resource.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/30 transition-all duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>{t('mediaResourcesPage.openLink', 'Открыть ссылку')}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MediaResources;
