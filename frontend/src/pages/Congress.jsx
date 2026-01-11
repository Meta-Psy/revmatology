import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { contentAPI } from '../services/api';

const Congress = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { id } = useParams();

  const [congresses, setCongresses] = useState([]);
  const [selectedCongress, setSelectedCongress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
  });

  useEffect(() => {
    loadCongresses();
  }, []);

  useEffect(() => {
    if (id && congresses.length > 0) {
      const congress = congresses.find(c => c.id === parseInt(id));
      if (congress) {
        setSelectedCongress(congress);
      }
    }
  }, [id, congresses]);

  const loadCongresses = async () => {
    try {
      const res = await contentAPI.getNews('event', true, 0, 100);
      const allEvents = res.data || [];

      const congressEvents = allEvents.filter(event => {
        const title = (event[`title_${lang}`] || event.title_ru || '').toLowerCase();
        return title.includes('конгресс') || title.includes('congress') || title.includes('kongress');
      });

      congressEvents.sort((a, b) => {
        const dateA = new Date(a.event_date_start || 0);
        const dateB = new Date(b.event_date_start || 0);
        return dateB - dateA;
      });

      setCongresses(congressEvents);

      const upcomingCongresses = congressEvents.filter(c =>
        c.event_date_start && new Date(c.event_date_start) >= new Date()
      );

      if (!id && upcomingCongresses.length === 1) {
        setSelectedCongress(upcomingCongresses[0]);
      } else if (!id && upcomingCongresses.length === 0 && congressEvents.length === 1) {
        setSelectedCongress(congressEvents[0]);
      }
    } catch (err) {
      console.error('Error loading congresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    return item[`${field}_${lang}`] || item[`${field}_ru`] || '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;

    const options = { day: 'numeric', month: 'long' };
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US';

    if (end && start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    } else if (end) {
      return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, { ...options, year: 'numeric' })}`;
    }
    return start.toLocaleDateString(locale, { ...options, year: 'numeric' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration submitted:', formData);
    alert(t('congress.registrationSuccess', 'Заявка отправлена!'));
    setShowRegistration(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectCongress = (congress) => {
    setSelectedCongress(congress);
    navigate(`/congress/${congress.id}`);
  };

  const backToList = () => {
    setSelectedCongress(null);
    navigate('/congress');
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

  // Список конгрессов
  if (!selectedCongress && congresses.length > 1) {
    const upcomingCongresses = congresses.filter(c =>
      c.event_date_start && new Date(c.event_date_start) >= new Date()
    );
    const pastCongresses = congresses.filter(c =>
      !c.event_date_start || new Date(c.event_date_start) < new Date()
    );

    return (
      <div>
        {/* Hero Section */}
        <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          {/* Угловые акценты */}
          <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-cyan-500/20"></div>
          <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-cyan-500/20"></div>
          <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-teal-500/20"></div>
          <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-teal-500/20"></div>

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
                {t('congress.title', 'Конгрессы')}
              </span>
            </nav>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                {lang === 'ru' ? 'Научные' : lang === 'uz' ? 'Ilmiy' : 'Scientific'}
              </span>{' '}
              <span className="font-normal">{lang === 'ru' ? 'Конгрессы' : lang === 'uz' ? 'Kongresslar' : 'Congresses'}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Georgia, serif' }}>
              {t('congress.subtitle', 'Научно-практические мероприятия Ассоциации ревматологов Узбекистана')}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-teal-500/[0.03] rounded-full blur-3xl"></div>

          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Предстоящие конгрессы */}
            {upcomingCongresses.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.upcoming', 'Предстоящие конгрессы')}
                  </h2>
                </div>

                <div className="space-y-6">
                  {upcomingCongresses.map((congress, index) => (
                    <button
                      key={congress.id}
                      onClick={() => selectCongress(congress)}
                      className="group w-full text-left bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden hover:shadow-xl hover:border-cyan-200 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Изображение */}
                        <div className="relative md:w-80 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                          {congress.image_url ? (
                            <img
                              src={congress.image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          {/* Номер на изображении */}
                          <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-sm font-medium text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Контент */}
                        <div className="flex-1 p-6 md:p-8">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-100">
                              {t('congress.open', 'Регистрация открыта')}
                            </span>
                          </div>

                          <h3 className="text-xl md:text-2xl text-stone-800 mb-4 group-hover:text-cyan-700 transition-colors leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            {getLocalizedField(congress, 'title')}
                          </h3>

                          <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-4">
                            {congress.event_date_start && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span style={{ fontFamily: 'Georgia, serif' }}>{formatDateRange(congress.event_date_start, congress.event_date_end)}</span>
                              </div>
                            )}
                            {congress.event_location_ru && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span style={{ fontFamily: 'Georgia, serif' }}>{getLocalizedField(congress, 'event_location')}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-stone-600 line-clamp-2 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                            {getLocalizedField(congress, 'excerpt') || getLocalizedField(congress, 'content')?.substring(0, 200)}
                          </p>

                          <div className="flex items-center gap-2 text-cyan-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                            <span>{t('congress.details', 'Подробнее')}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Прошедшие конгрессы */}
            {pastCongresses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-stone-400 to-stone-500 rounded-xl flex items-center justify-center shadow-lg shadow-stone-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.past', 'Прошедшие конгрессы')}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {pastCongresses.map((congress, index) => (
                    <button
                      key={congress.id}
                      onClick={() => selectCongress(congress)}
                      className="group relative text-left bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60 hover:shadow-lg hover:border-stone-300 transition-all duration-300"
                    >
                      {/* Фоновый номер */}
                      <div className="absolute top-4 right-4 text-6xl font-light text-stone-100 select-none" style={{ fontFamily: 'Georgia, serif' }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-600">
                            {t('congress.completed', 'Завершён')}
                          </span>
                          <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>
                            {formatDate(congress.event_date_start)}
                          </span>
                        </div>

                        <h3 className="text-lg text-stone-800 mb-3 group-hover:text-cyan-700 transition-colors leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                          {getLocalizedField(congress, 'title')}
                        </h3>

                        {congress.event_location_ru && (
                          <p className="text-sm text-stone-500 flex items-center gap-2">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span style={{ fontFamily: 'Georgia, serif' }}>{getLocalizedField(congress, 'event_location')}</span>
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Пустое состояние */}
            {congresses.length === 0 && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-stone-200">
                  <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('congress.noCongresses', 'Конгрессы пока не запланированы')}
                </h3>
                <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('congress.checkLater', 'Следите за обновлениями на сайте')}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Детальная страница конгресса
  const congress = selectedCongress || {
    title_ru: 'III Конгресс Ревматологов Узбекистана',
    title_uz: "III O'zbekiston revmatologlar kongressi",
    title_en: 'III Congress of Rheumatologists of Uzbekistan',
    content_ru: 'III Конгресс Ревматологов Узбекистана — крупнейшее научно-практическое мероприятие, объединяющее ведущих специалистов в области ревматологии из Узбекистана и зарубежных стран.',
    event_date_start: '2025-05-15',
    event_date_end: '2025-05-17',
    event_location_ru: 'Ташкент, Узбекистан',
    event_location_uz: 'Toshkent, O\'zbekiston',
    event_location_en: 'Tashkent, Uzbekistan',
  };

  const isUpcoming = congress.event_date_start && new Date(congress.event_date_start) >= new Date();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Угловые акценты */}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-cyan-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-cyan-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-teal-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-teal-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Навигационная цепочка */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
              {t('nav.home', 'Главная')}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {congresses.length > 1 ? (
              <>
                <button onClick={backToList} className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('congress.title', 'Конгрессы')}
                </button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white line-clamp-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {getLocalizedField(congress, 'title').substring(0, 30)}...
                </span>
              </>
            ) : (
              <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>
                {t('congress.title', 'Конгресс')}
              </span>
            )}
          </nav>

          {/* Статус */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              isUpcoming
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'
            }`}>
              {isUpcoming && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
              {isUpcoming ? t('congress.upcoming', 'Предстоящий') : t('congress.completed', 'Завершён')}
            </span>
          </div>

          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-4 leading-tight max-w-4xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {getLocalizedField(congress, 'title')}
          </h1>

          {/* Дата и место */}
          <div className="flex flex-wrap gap-6 text-slate-300">
            {congress.event_date_start && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ fontFamily: 'Georgia, serif' }}>{formatDateRange(congress.event_date_start, congress.event_date_end)}</span>
              </div>
            )}
            {congress.event_location_ru && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span style={{ fontFamily: 'Georgia, serif' }}>{getLocalizedField(congress, 'event_location')}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-teal-500/[0.03] rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* О конгрессе */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.about', 'О конгрессе')}
                  </h2>
                </div>
                <div
                  className="text-stone-600 leading-relaxed prose prose-stone max-w-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                  dangerouslySetInnerHTML={{ __html: getLocalizedField(congress, 'content') || '' }}
                />
              </div>

              {/* Программа */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.program', 'Программа')}
                  </h2>
                </div>

                <div className="space-y-6">
                  {[
                    { day: t('congress.day1', 'День 1'), color: 'cyan', events: [t('congress.registration', 'Регистрация участников'), t('congress.opening', 'Торжественное открытие'), t('congress.plenary', 'Пленарное заседание')] },
                    { day: t('congress.day2', 'День 2'), color: 'violet', events: [t('congress.symposiums', 'Симпозиумы'), t('congress.workshops', 'Мастер-классы'), t('congress.posters', 'Постерная сессия')] },
                    { day: t('congress.day3', 'День 3'), color: 'teal', events: [t('congress.roundtables', 'Круглые столы'), t('congress.closing', 'Закрытие конгресса')] },
                  ].map((dayProgram, i) => (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-${dayProgram.color}-500 to-${dayProgram.color}-300`}></div>
                      <div className={`absolute left-[-3px] top-1 w-2 h-2 rounded-full bg-${dayProgram.color}-500`}></div>
                      <h3 className="font-medium text-stone-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{dayProgram.day}</h3>
                      <ul className="space-y-2">
                        {dayProgram.events.map((event, j) => (
                          <li key={j} className="flex items-center gap-3 text-stone-600" style={{ fontFamily: 'Georgia, serif' }}>
                            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full flex-shrink-0"></span>
                            {event}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Спикеры */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.speakers', 'Спикеры')}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.speaker', 'Спикер')} {i}</h3>
                        <p className="text-sm text-stone-500">{t('congress.degree', 'д.м.н., профессор')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Регистрация */}
              {isUpcoming && (
                <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden sticky top-24">
                  {/* Декоративные элементы */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-cyan-500/30"></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-cyan-500/30"></div>

                  <div className="relative">
                    <h3 className="text-lg text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                      {t('congress.register', 'Регистрация')}
                    </h3>

                    <div className="flex items-center justify-between text-sm mb-6 pb-4 border-b border-slate-700">
                      <span className="text-slate-400">{t('congress.status', 'Статус')}:</span>
                      <span className="text-green-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        {t('congress.open', 'Открыта')}
                      </span>
                    </div>

                    {congress.registration_url ? (
                      <a
                        href={congress.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-teal-500 transition-all text-center shadow-lg shadow-cyan-500/20"
                      >
                        {t('congress.register', 'Регистрация')}
                      </a>
                    ) : (
                      <button
                        onClick={() => setShowRegistration(true)}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-teal-500 transition-all shadow-lg shadow-cyan-500/20"
                      >
                        {t('congress.register', 'Регистрация')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Место проведения */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.location', 'Место проведения')}
                  </h3>
                </div>

                <div className="h-40 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl mb-4 flex items-center justify-center border border-stone-200">
                  <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>

                <p className="text-stone-600" style={{ fontFamily: 'Georgia, serif' }}>
                  {getLocalizedField(congress, 'event_location')}
                </p>
              </div>

              {/* Контакты */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {lang === 'ru' ? 'Контакты' : lang === 'uz' ? 'Kontaktlar' : 'Contacts'}
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <a href="mailto:info@rheumatology.uz" className="flex items-center gap-3 text-stone-600 hover:text-cyan-600 transition-colors">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ fontFamily: 'Georgia, serif' }}>info@rheumatology.uz</span>
                  </a>
                  <a href="tel:+998712345678" className="flex items-center gap-3 text-stone-600 hover:text-cyan-600 transition-colors">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span style={{ fontFamily: 'Georgia, serif' }}>+998 71 234 56 78</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Декоративная линия */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-600"></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                {t('congress.registrationForm.title', 'Регистрация на конгресс')}
              </h2>
              <button
                onClick={() => setShowRegistration(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('congress.registrationForm.fullName', 'ФИО')} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('congress.registrationForm.email', 'Email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('congress.registrationForm.phone', 'Телефон')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('congress.registrationForm.organization', 'Организация')}
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('congress.registrationForm.position', 'Должность')}
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-teal-500 transition-all shadow-lg shadow-cyan-500/20"
              >
                {t('congress.registrationForm.submit', 'Отправить заявку')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Congress;
