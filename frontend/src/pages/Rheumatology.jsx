import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const Rheumatology = ({ defaultTab = 'centers' }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ru';

  const [centers, setCenters] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerStaff, setCenterStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);


  useEffect(() => {
    loadData();
  }, [defaultTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (defaultTab === 'centers') {
        const centersRes = await contentAPI.getCenters();
        setCenters(Array.isArray(centersRes.data) ? centersRes.data : []);
      } else if (defaultTab === 'chiefs') {
        const doctorsRes = await contentAPI.getChiefRheumatologists();
        setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : []);
      } else if (defaultTab === 'documents') {
        const docsRes = await contentAPI.getDiseases();
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const handleCenterSelect = async (center) => {
    if (selectedCenter?.id === center.id) {
      setSelectedCenter(null);
      setCenterStaff([]);
      return;
    }

    setSelectedCenter(center);
    setLoadingStaff(true);
    try {
      const res = await contentAPI.getCenterStaff(center.id);
      setCenterStaff(res.data);
    } catch (error) {
      console.error('Error loading staff:', error);
      setCenterStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Конфигурация для разных табов
  const tabConfig = {
    centers: {
      title: lang === 'ru' ? 'Специализированные' : lang === 'uz' ? 'Ixtisoslashtirilgan' : 'Specialized',
      titleHighlight: lang === 'ru' ? 'Центры' : lang === 'uz' ? 'Markazlar' : 'Centers',
      subtitle: lang === 'ru' ? 'Ревматологические отделения и центры Узбекистана' : lang === 'uz' ? "O'zbekistonning revmatologiya bo'limlari va markazlari" : 'Rheumatology departments and centers of Uzbekistan',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'sky'
    },
    chiefs: {
      title: lang === 'ru' ? 'Главные' : lang === 'uz' ? 'Bosh' : 'Chief',
      titleHighlight: lang === 'ru' ? 'Ревматологи' : lang === 'uz' ? 'Revmatologlar' : 'Rheumatologists',
      subtitle: lang === 'ru' ? 'Ведущие специалисты-ревматологи регионов Узбекистана' : lang === 'uz' ? "O'zbekiston mintaqalarining yetakchi revmatolog mutaxassislari" : 'Leading rheumatology specialists of Uzbekistan regions',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'sky'
    },
    documents: {
      title: lang === 'ru' ? 'Нормативные' : lang === 'uz' ? 'Normativ' : 'Regulatory',
      titleHighlight: lang === 'ru' ? 'Документы' : lang === 'uz' ? 'Hujjatlar' : 'Documents',
      subtitle: lang === 'ru' ? 'Клинические рекомендации и протоколы по ревматическим заболеваниям' : lang === 'uz' ? "Revmatik kasalliklar bo'yicha klinik tavsiyalar va protokollar" : 'Clinical recommendations and protocols for rheumatic diseases',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'emerald'
    }
  };

  const config = tabConfig[defaultTab];

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
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Угловые акценты */}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-sky-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-sky-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-blue-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-blue-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Навигационная цепочка */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
              {t('nav.home', 'Главная')}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>
              {config.title} {config.titleHighlight}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Левая часть - заголовок */}
            <div className="lg:max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
                <div className="w-1.5 h-1.5 rotate-45 bg-sky-400"></div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span className={`font-light ${
                  config.color === 'emerald' ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400' :
                  'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400'
                }`}>
                  {config.title}
                </span>{' '}
                <span className="font-normal">{config.titleHighlight}</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                {config.subtitle}
              </p>
            </div>

            {/* Правая часть - список центров (только для centers) */}
            {defaultTab === 'centers' && centers.length > 0 && (
              <div className="hidden lg:block">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                  {lang === 'ru' ? 'Центры' : lang === 'uz' ? 'Markazlar' : 'Centers'}
                </div>
                <div className="space-y-1.5">
                  {centers.map((center, index) => (
                    <button
                      key={center.id}
                      onClick={() => handleCenterSelect(center)}
                      className={`group flex items-center gap-3 text-left transition-all ${
                        selectedCenter?.id === center.id ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-medium w-5" style={{ fontFamily: 'Georgia, serif' }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm line-clamp-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {getLocalizedField(center, 'name')}
                      </span>
                      {selectedCenter?.id === center.id && (
                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Фон */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>

        {/* Тонкий паттерн */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Centers View */}
          {defaultTab === 'centers' && (
            <>
              {centers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                    {lang === 'ru' ? 'Центры не найдены' : lang === 'uz' ? 'Markazlar topilmadi' : 'No centers found'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Левая панель навигации - мини-карточки */}
                  <div className="hidden lg:block w-56 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                      {centers.map((center, index) => (
                        <button
                          key={center.id}
                          onClick={() => handleCenterSelect(center)}
                          className={`group w-full text-left p-3 rounded-xl transition-all duration-300 ${
                            selectedCenter?.id === center.id
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg'
                              : 'bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Номер */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              selectedCenter?.id === center.id
                                ? 'bg-sky-500/20 text-sky-400'
                                : 'bg-stone-100 text-stone-400 group-hover:bg-sky-50 group-hover:text-sky-500'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            {/* Название */}
                            <span className={`text-sm line-clamp-2 leading-tight ${
                              selectedCenter?.id === center.id ? 'text-white' : 'text-stone-700'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {getLocalizedField(center, 'name')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Мобильная навигация */}
                  <div className="lg:hidden w-full mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                    <div className="flex gap-2 min-w-max">
                      {centers.map((center, index) => (
                        <button
                          key={center.id}
                          onClick={() => handleCenterSelect(center)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap max-w-[200px] ${
                            selectedCenter?.id === center.id
                              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                              : 'bg-white text-stone-600 border border-stone-200 hover:border-sky-300'
                          }`}
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          <span className="mr-1.5 opacity-60">{String(index + 1).padStart(2, '0')}</span>
                          <span className="truncate">{getLocalizedField(center, 'name').split(' ').slice(0, 2).join(' ')}...</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Правая часть - контент */}
                  <div className="flex-1 min-w-0">
                    {!selectedCenter ? (
                      <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-200/60 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-stone-200">
                          <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                          {lang === 'ru' ? 'Выберите центр' : lang === 'uz' ? 'Markazni tanlang' : 'Select a center'}
                        </h3>
                        <p className="text-stone-500 max-w-md" style={{ fontFamily: 'Georgia, serif' }}>
                          {lang === 'ru'
                            ? 'Нажмите на номер центра слева, чтобы увидеть информацию и команду специалистов'
                            : lang === 'uz'
                            ? "Markaz va mutaxassislar jamoasi haqida ma'lumot ko'rish uchun chapdagi raqamni bosing"
                            : 'Click on a center number to see information and the team of specialists'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Компактный header центра */}
                        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden">
                          {/* Декоративные элементы */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-sky-500/30"></div>
                          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-sky-500/30"></div>

                          <div className="relative">
                            {/* Название */}
                            <div className="flex items-start gap-2 mb-4">
                              <div className="w-5 h-px bg-sky-400/60 mt-3"></div>
                              <div className="w-1 h-1 rotate-45 bg-sky-400/60 mt-2.5"></div>
                              <h3 className="text-xl md:text-2xl text-white flex-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {getLocalizedField(selectedCenter, 'name')}
                              </h3>
                            </div>

                            {/* Компактные контакты в строку */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {getLocalizedField(selectedCenter, 'address') && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span className="line-clamp-1">{getLocalizedField(selectedCenter, 'address')}</span>
                                </div>
                              )}
                              {selectedCenter.phone && (
                                <a href={`tel:${selectedCenter.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors">
                                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span>{selectedCenter.phone}</span>
                                </a>
                              )}
                              {selectedCenter.email && (
                                <a href={`mailto:${selectedCenter.email}`} className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors">
                                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span>{selectedCenter.email}</span>
                                </a>
                              )}
                            </div>

                            {/* Описание (если есть) - компактно */}
                            {getLocalizedField(selectedCenter, 'description') && (
                              <p className="mt-4 text-sm text-slate-400 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {getLocalizedField(selectedCenter, 'description')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Галерея сотрудников */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
                          {/* Заголовок секции */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                                  {lang === 'ru' ? 'Команда специалистов' : lang === 'uz' ? 'Mutaxassislar jamoasi' : 'Team of Specialists'}
                                </h4>
                                {!loadingStaff && centerStaff.length > 0 && (
                                  <p className="text-xs text-stone-500">
                                    {centerStaff.length} {lang === 'ru' ? 'сотрудников' : lang === 'uz' ? 'xodimlar' : 'staff members'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {loadingStaff ? (
                            <div className="flex items-center justify-center py-16">
                              <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
                            </div>
                          ) : centerStaff.length === 0 ? (
                            <div className="text-center py-16 text-stone-400">
                              <svg className="w-16 h-16 mx-auto mb-4 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <p style={{ fontFamily: 'Georgia, serif' }}>
                                {lang === 'ru' ? 'Сотрудники не добавлены' : lang === 'uz' ? "Xodimlar qo'shilmagan" : 'No staff added'}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                              {centerStaff.map((staff) => (
                                <div
                                  key={staff.id}
                                  className="group relative"
                                >
                                  {/* Фото карточка */}
                                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-stone-200 shadow-sm group-hover:shadow-lg transition-all duration-300">
                                    {staff.photo_url ? (
                                      <img
                                        src={`http://localhost:8000${staff.photo_url}`}
                                        alt={`${getLocalizedField(staff, 'last_name')} ${getLocalizedField(staff, 'first_name')}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                        <span className="text-white text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                                          {getLocalizedField(staff, 'first_name')?.charAt(0)}
                                          {getLocalizedField(staff, 'last_name')?.charAt(0)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Overlay при наведении */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                      {getLocalizedField(staff, 'position') && (
                                        <p className="text-sky-400 text-xs mb-1 line-clamp-2">
                                          {getLocalizedField(staff, 'position')}
                                        </p>
                                      )}
                                      {getLocalizedField(staff, 'credentials') && (
                                        <p className="text-slate-400 text-xs line-clamp-2">
                                          {getLocalizedField(staff, 'credentials')}
                                        </p>
                                      )}
                                    </div>

                                    {/* Градиент снизу для имени */}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity duration-300"></div>
                                  </div>

                                  {/* Имя под фото */}
                                  <div className="mt-2 text-center">
                                    <h5 className="text-sm text-stone-800 font-medium leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                                      {getLocalizedField(staff, 'last_name')}
                                    </h5>
                                    <p className="text-xs text-stone-500 leading-tight">
                                      {getLocalizedField(staff, 'first_name')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chiefs View */}
          {defaultTab === 'chiefs' && (
            <>
              {doctors.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                    {lang === 'ru' ? 'Специалисты не найдены' : lang === 'uz' ? 'Mutaxassislar topilmadi' : 'No specialists found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-12 md:space-y-16">
                  {doctors.map((doctor, index) => {
                    const isEven = index % 2 === 0;

                    return (
                      <article key={doctor.id} className="relative">
                        {/* Номер - фоновый */}
                        <div
                          className={`absolute top-0 text-[120px] md:text-[180px] font-light text-stone-100 select-none leading-none ${
                            isEven ? 'left-0 md:left-4' : 'right-0 md:right-4'
                          }`}
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className={`relative flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 md:gap-10 items-start`}>
                          {/* Фото */}
                          <div className="w-full md:w-5/12 lg:w-4/12">
                            <div className="group/photo relative">
                              <div className="relative aspect-[3/4] bg-stone-100 shadow-lg overflow-hidden">
                                {doctor.photo_url ? (
                                  <img
                                    src={`http://localhost:8000${doctor.photo_url}`}
                                    alt={`${getLocalizedField(doctor, 'last_name')} ${getLocalizedField(doctor, 'first_name')}`}
                                    className="w-full h-full object-cover grayscale-[15%] sepia-[5%] group-hover/photo:grayscale-[5%] group-hover/photo:sepia-0 transition-all duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                    <span className="text-white text-4xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                                      {getLocalizedField(doctor, 'first_name')?.charAt(0)}
                                      {getLocalizedField(doctor, 'last_name')?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Регион - внизу фото */}
                              {getLocalizedField(doctor, 'region') && (
                                <div className="absolute -bottom-4 left-0 right-0 text-center">
                                  <span className="inline-block px-4 py-1.5 bg-slate-800 text-slate-100 text-xs tracking-wider uppercase shadow-md" style={{ fontFamily: 'Georgia, serif' }}>
                                    {getLocalizedField(doctor, 'region')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Информация */}
                          <div className="w-full md:w-7/12 lg:w-8/12 pt-6 md:pt-0">
                            {/* Имя */}
                            <h3 className="text-xl sm:text-2xl md:text-3xl text-stone-800 mb-2 leading-snug tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                              {getLocalizedField(doctor, 'last_name')}{' '}
                              {getLocalizedField(doctor, 'first_name')}{' '}
                              {getLocalizedField(doctor, 'patronymic') && (
                                <span className="text-stone-500">{getLocalizedField(doctor, 'patronymic')}</span>
                              )}
                            </h3>

                            {/* Разделитель */}
                            <div className="flex items-center gap-2 my-4">
                              <div className="w-12 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
                              <div className="w-1 h-1 rotate-45 bg-sky-400"></div>
                            </div>

                            {/* Ученая степень */}
                            {getLocalizedField(doctor, 'degree') && (
                              <p className="text-base md:text-lg text-sky-800/70 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                                <em>{getLocalizedField(doctor, 'degree')}</em>
                              </p>
                            )}

                            {/* Должность */}
                            {getLocalizedField(doctor, 'position') && (
                              <p className="text-base text-stone-700 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                                {getLocalizedField(doctor, 'position')}
                              </p>
                            )}

                            {/* Место работы */}
                            {getLocalizedField(doctor, 'workplace') && (
                              <div className="mb-5 flex items-start gap-3">
                                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                                  {getLocalizedField(doctor, 'workplace')}
                                </p>
                              </div>
                            )}

                            {/* Биография */}
                            {getLocalizedField(doctor, 'bio') && (
                              <div className="relative mb-6">
                                <div className="absolute -left-1 -top-3 text-5xl text-stone-200/80 leading-none select-none" style={{ fontFamily: 'Georgia, serif' }}>
                                  «
                                </div>
                                <div className="pl-6 border-l-2 border-stone-200">
                                  <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                                    <em>{getLocalizedField(doctor, 'bio')}</em>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Достижения */}
                            {getLocalizedField(doctor, 'achievements') && (
                              <div className="mb-6 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-500/60 via-blue-500/30 to-transparent"></div>
                                <div className="pl-5">
                                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                                    {lang === 'ru' ? 'Достижения и награды' : lang === 'uz' ? "Yutuqlar va mukofotlar" : 'Achievements and awards'}
                                  </h4>
                                  <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                                    {getLocalizedField(doctor, 'achievements')}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Контакты */}
                            {(doctor.email || doctor.phone) && (
                              <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-stone-200">
                                {doctor.email && (
                                  <a
                                    href={`mailto:${doctor.email}`}
                                    className="group flex items-center gap-2.5 text-stone-500 hover:text-sky-700 transition-all duration-300"
                                  >
                                    <span className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center group-hover:border-sky-400 group-hover:bg-sky-50/50 transition-all duration-300">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </span>
                                    <span className="text-sm" style={{ fontFamily: 'Georgia, serif' }}>{doctor.email}</span>
                                  </a>
                                )}
                                {doctor.phone && (
                                  <a
                                    href={`tel:${doctor.phone}`}
                                    className="group flex items-center gap-2.5 text-stone-500 hover:text-sky-700 transition-all duration-300"
                                  >
                                    <span className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center group-hover:border-sky-400 group-hover:bg-sky-50/50 transition-all duration-300">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                    </span>
                                    <span className="text-sm" style={{ fontFamily: 'Georgia, serif' }}>{doctor.phone}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Documents View */}
          {defaultTab === 'documents' && (
            <>
              {documents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                    {lang === 'ru' ? 'Документы не найдены' : lang === 'uz' ? 'Hujjatlar topilmadi' : 'No documents found'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Левая панель навигации */}
                  <div className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                      {documents.map((doc, index) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedCenter(selectedCenter?.id === doc.id ? null : doc)}
                          className={`group w-full text-left p-3 rounded-xl transition-all duration-300 ${
                            selectedCenter?.id === doc.id
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg'
                              : 'bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Номер */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              selectedCenter?.id === doc.id
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-stone-100 text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            {/* Название */}
                            <div className="flex-1 min-w-0">
                              {doc.short_name && (
                                <span className={`text-xs font-medium uppercase tracking-wide ${
                                  selectedCenter?.id === doc.id ? 'text-emerald-400' : 'text-stone-400'
                                }`}>
                                  {doc.short_name}
                                </span>
                              )}
                              <span className={`block text-sm line-clamp-2 leading-tight ${
                                selectedCenter?.id === doc.id ? 'text-white' : 'text-stone-700'
                              }`} style={{ fontFamily: 'Georgia, serif' }}>
                                {getLocalizedField(doc, 'name')}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Мобильная навигация */}
                  <div className="lg:hidden w-full mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                    <div className="flex gap-2 min-w-max">
                      {documents.map((doc, index) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedCenter(selectedCenter?.id === doc.id ? null : doc)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                            selectedCenter?.id === doc.id
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                              : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                          }`}
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          <span className="mr-1.5 opacity-60">{String(index + 1).padStart(2, '0')}</span>
                          <span>{doc.short_name || getLocalizedField(doc, 'name').split(' ').slice(0, 2).join(' ')}...</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Правая часть - контент */}
                  <div className="flex-1 min-w-0">
                    {!selectedCenter ? (
                      <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-200/60 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-stone-200">
                          <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                          {lang === 'ru' ? 'Выберите документ' : lang === 'uz' ? 'Hujjatni tanlang' : 'Select a document'}
                        </h3>
                        <p className="text-stone-500 max-w-md" style={{ fontFamily: 'Georgia, serif' }}>
                          {lang === 'ru'
                            ? 'Нажмите на название документа слева, чтобы увидеть подробную информацию и скачать файлы'
                            : lang === 'uz'
                            ? "Batafsil ma'lumot ko'rish va fayllarni yuklab olish uchun chapdagi hujjat nomini bosing"
                            : 'Click on a document name to see detailed information and download files'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Header документа */}
                        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                          {/* Декоративные элементы */}
                          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
                          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-emerald-500/30"></div>
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-emerald-500/30"></div>

                          <div className="relative">
                            {/* Аббревиатура */}
                            {selectedCenter.short_name && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="text-emerald-400 text-sm font-medium tracking-wide">
                                  {selectedCenter.short_name}
                                </span>
                              </div>
                            )}

                            {/* Название */}
                            <div className="flex items-start gap-2 mb-4">
                              <div className="w-6 h-px bg-emerald-400/60 mt-3"></div>
                              <div className="w-1.5 h-1.5 rotate-45 bg-emerald-400/60 mt-2"></div>
                              <h3 className="text-xl md:text-2xl lg:text-3xl text-white flex-1 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {getLocalizedField(selectedCenter, 'name')}
                              </h3>
                            </div>

                            {/* Описание */}
                            {getLocalizedField(selectedCenter, 'description') && (
                              <p className="text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
                                {getLocalizedField(selectedCenter, 'description')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Секция скачивания */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                          {/* Заголовок секции */}
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                                {lang === 'ru' ? 'Доступные документы' : lang === 'uz' ? 'Mavjud hujjatlar' : 'Available Documents'}
                              </h4>
                              <p className="text-xs text-stone-500">
                                {lang === 'ru' ? 'Скачайте необходимые файлы' : lang === 'uz' ? 'Kerakli fayllarni yuklab oling' : 'Download the files you need'}
                              </p>
                            </div>
                          </div>

                          {/* Карточки документов */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Клинические рекомендации */}
                            {selectedCenter.recommendation_file_url ? (
                              <a
                                href={`http://localhost:8000${selectedCenter.recommendation_file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                              >
                                {/* Фоновый номер */}
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
                                    {lang === 'ru' ? 'Клинические рекомендации' : lang === 'uz' ? 'Klinik tavsiyalar' : 'Clinical Recommendations'}
                                  </h5>
                                  <p className="text-sm text-stone-500 mb-4">
                                    {lang === 'ru' ? 'Рекомендации по диагностике и лечению' : lang === 'uz' ? "Tashxis va davolash bo'yicha tavsiyalar" : 'Recommendations for diagnosis and treatment'}
                                  </p>

                                  <div className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                                    <span>{lang === 'ru' ? 'Скачать PDF' : lang === 'uz' ? 'PDF yuklab olish' : 'Download PDF'}</span>
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
                                    {lang === 'ru' ? 'Клинические рекомендации' : lang === 'uz' ? 'Klinik tavsiyalar' : 'Clinical Recommendations'}
                                  </h5>
                                  <p className="text-sm text-stone-400">
                                    {lang === 'ru' ? 'Документ не загружен' : lang === 'uz' ? 'Hujjat yuklanmagan' : 'Document not uploaded'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Клинический протокол */}
                            {selectedCenter.protocol_file_url ? (
                              <a
                                href={`http://localhost:8000${selectedCenter.protocol_file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
                              >
                                {/* Фоновый номер */}
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
                                    {lang === 'ru' ? 'Клинический протокол' : lang === 'uz' ? 'Klinik protokol' : 'Clinical Protocol'}
                                  </h5>
                                  <p className="text-sm text-stone-500 mb-4">
                                    {lang === 'ru' ? 'Стандарты оказания медицинской помощи' : lang === 'uz' ? "Tibbiy yordam ko'rsatish standartlari" : 'Standards of medical care'}
                                  </p>

                                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                                    <span>{lang === 'ru' ? 'Скачать PDF' : lang === 'uz' ? 'PDF yuklab olish' : 'Download PDF'}</span>
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
                                    {lang === 'ru' ? 'Клинический протокол' : lang === 'uz' ? 'Klinik protokol' : 'Clinical Protocol'}
                                  </h5>
                                  <p className="text-sm text-stone-400">
                                    {lang === 'ru' ? 'Документ не загружен' : lang === 'uz' ? 'Hujjat yuklanmagan' : 'Document not uploaded'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Информация внизу */}
                          {!selectedCenter.recommendation_file_url && !selectedCenter.protocol_file_url && (
                            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                  <p className="text-sm text-amber-800 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                                    {lang === 'ru' ? 'Документы в процессе подготовки' : lang === 'uz' ? 'Hujjatlar tayyorlanmoqda' : 'Documents are being prepared'}
                                  </p>
                                  <p className="text-xs text-amber-600 mt-1">
                                    {lang === 'ru' ? 'Скоро здесь появятся файлы для скачивания' : lang === 'uz' ? "Tez orada bu yerda yuklab olish uchun fayllar paydo bo'ladi" : 'Files will be available for download soon'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Rheumatology;
