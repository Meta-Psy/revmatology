import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const DiseaseInfo = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [diseases, setDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getDiseases();
      setDiseases(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading diseases:', error);
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
          <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Corner accents */}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-emerald-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-emerald-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-teal-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-teal-500/20"></div>

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
              {t('diseaseInfoPage.title', 'Информация о заболеваниях')}
            </span>
          </nav>

          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-emerald-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-emerald-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                {t('diseaseInfoPage.title', 'Информация о заболеваниях')}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {t('diseaseInfoPage.subtitle', 'Клинические рекомендации и протоколы по ревматическим заболеваниям')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-teal-500/[0.03] rounded-full blur-3xl"></div>

        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {diseases.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                {lang === 'ru' ? 'Заболевания не найдены' : lang === 'uz' ? 'Kasalliklar topilmadi' : 'No diseases found'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left sidebar navigation */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-2">
                  {diseases.map((disease, index) => (
                    <button
                      key={disease.id}
                      onClick={() => setSelectedDisease(selectedDisease?.id === disease.id ? null : disease)}
                      className={`group w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        selectedDisease?.id === disease.id
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg'
                          : 'bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Number */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          selectedDisease?.id === disease.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-stone-100 text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                        }`} style={{ fontFamily: 'Georgia, serif' }}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          {disease.short_name && (
                            <span className={`text-xs font-medium uppercase tracking-wide ${
                              selectedDisease?.id === disease.id ? 'text-emerald-400' : 'text-stone-400'
                            }`}>
                              {disease.short_name}
                            </span>
                          )}
                          <span className={`block text-sm line-clamp-2 leading-tight ${
                            selectedDisease?.id === disease.id ? 'text-white' : 'text-stone-700'
                          }`} style={{ fontFamily: 'Georgia, serif' }}>
                            {getField(disease, 'name')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile navigation */}
              <div className="lg:hidden w-full mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                <div className="flex gap-2 min-w-max">
                  {diseases.map((disease, index) => (
                    <button
                      key={disease.id}
                      onClick={() => setSelectedDisease(selectedDisease?.id === disease.id ? null : disease)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                        selectedDisease?.id === disease.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                      }`}
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      <span className="mr-1.5 opacity-60">{String(index + 1).padStart(2, '0')}</span>
                      <span>{disease.short_name || getField(disease, 'name').split(' ').slice(0, 2).join(' ')}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel - content */}
              <div className="flex-1 min-w-0">
                {!selectedDisease ? (
                  <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-200/60 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-stone-200">
                      <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      {t('diseaseInfoPage.selectDisease', 'Выберите заболевание')}
                    </h3>
                    <p className="text-stone-500 max-w-md" style={{ fontFamily: 'Georgia, serif' }}>
                      {t('diseaseInfoPage.selectDiseaseDesc', 'Нажмите на название заболевания, чтобы увидеть подробную информацию')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Disease header */}
                    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
                      <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-emerald-500/30"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-emerald-500/30"></div>

                      <div className="relative">
                        {/* Short name badge */}
                        {selectedDisease.short_name && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-emerald-400 text-sm font-medium tracking-wide">
                              {selectedDisease.short_name}
                            </span>
                          </div>
                        )}

                        {/* Disease name */}
                        <div className="flex items-start gap-2 mb-4">
                          <div className="w-6 h-px bg-emerald-400/60 mt-3"></div>
                          <div className="w-1.5 h-1.5 rotate-45 bg-emerald-400/60 mt-2"></div>
                          <h3 className="text-xl md:text-2xl lg:text-3xl text-white flex-1 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            {getField(selectedDisease, 'name')}
                          </h3>
                        </div>

                        {/* Description */}
                        {getField(selectedDisease, 'description') && (
                          <p className="text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
                            {getField(selectedDisease, 'description')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rich text content */}
                    {getField(selectedDisease, 'content') && (
                      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                        <div
                          className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed"
                          style={{ fontFamily: 'Georgia, serif' }}
                          dangerouslySetInnerHTML={{ __html: getField(selectedDisease, 'content') }}
                        />
                      </div>
                    )}

                    {/* Documents section */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                            {t('diseaseInfoPage.availableDocs', 'Доступные документы')}
                          </h4>
                          <p className="text-xs text-stone-500">
                            {lang === 'ru' ? 'Скачайте необходимые файлы' : lang === 'uz' ? 'Kerakli fayllarni yuklab oling' : 'Download the files you need'}
                          </p>
                        </div>
                      </div>

                      {/* Document cards */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Clinical recommendations */}
                        {selectedDisease.recommendation_file_url ? (
                          <a
                            href={`http://localhost:8000${selectedDisease.recommendation_file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                          >
                            {/* Background number */}
                            <div className="absolute top-3 right-3 text-6xl font-light text-blue-100 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                              01
                            </div>

                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>

                              <h5 className="text-base font-medium text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                {t('diseaseInfoPage.recommendations', 'Клинические рекомендации')}
                              </h5>
                              <p className="text-sm text-stone-500 mb-4">
                                {lang === 'ru' ? 'Рекомендации по диагностике и лечению' : lang === 'uz' ? "Tashxis va davolash bo'yicha tavsiyalar" : 'Recommendations for diagnosis and treatment'}
                              </p>

                              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                                <span>{t('diseaseInfoPage.downloadPdf', 'Скачать PDF')}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="relative bg-stone-50 rounded-xl p-5 border border-stone-200 opacity-60">
                            <div className="absolute top-3 right-3 text-6xl font-light text-stone-100 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                              01
                            </div>
                            <div className="relative">
                              <div className="w-14 h-14 bg-stone-200 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h5 className="text-base font-medium text-stone-500 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                {t('diseaseInfoPage.recommendations', 'Клинические рекомендации')}
                              </h5>
                              <p className="text-sm text-stone-400">
                                {t('diseaseInfoPage.notUploaded', 'Документ не загружен')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Clinical protocol */}
                        {selectedDisease.protocol_file_url ? (
                          <a
                            href={`http://localhost:8000${selectedDisease.protocol_file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
                          >
                            {/* Background number */}
                            <div className="absolute top-3 right-3 text-6xl font-light text-emerald-100 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                              02
                            </div>

                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </div>

                              <h5 className="text-base font-medium text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                {t('diseaseInfoPage.protocol', 'Клинический протокол')}
                              </h5>
                              <p className="text-sm text-stone-500 mb-4">
                                {lang === 'ru' ? 'Стандарты оказания медицинской помощи' : lang === 'uz' ? "Tibbiy yordam ko'rsatish standartlari" : 'Standards of medical care'}
                              </p>

                              <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                                <span>{t('diseaseInfoPage.downloadPdf', 'Скачать PDF')}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="relative bg-stone-50 rounded-xl p-5 border border-stone-200 opacity-60">
                            <div className="absolute top-3 right-3 text-6xl font-light text-stone-100 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                              02
                            </div>
                            <div className="relative">
                              <div className="w-14 h-14 bg-stone-200 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </div>
                              <h5 className="text-base font-medium text-stone-500 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                {t('diseaseInfoPage.protocol', 'Клинический протокол')}
                              </h5>
                              <p className="text-sm text-stone-400">
                                {t('diseaseInfoPage.notUploaded', 'Документ не загружен')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DiseaseInfo;
