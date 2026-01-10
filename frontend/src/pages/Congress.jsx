import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
    // Если передан id в URL, выбираем соответствующий конгресс
    if (id && congresses.length > 0) {
      const congress = congresses.find(c => c.id === parseInt(id));
      if (congress) {
        setSelectedCongress(congress);
      }
    }
  }, [id, congresses]);

  const loadCongresses = async () => {
    try {
      // Загружаем события типа "event" из API
      const res = await contentAPI.getNews('event', true, 0, 100);
      const allEvents = res.data || [];

      // Фильтруем только конгрессы
      const congressEvents = allEvents.filter(event => {
        const title = (event[`title_${lang}`] || event.title_ru || '').toLowerCase();
        return title.includes('конгресс') || title.includes('congress') || title.includes('kongress');
      });

      // Сортируем по дате
      congressEvents.sort((a, b) => {
        const dateA = new Date(a.event_date_start || 0);
        const dateB = new Date(b.event_date_start || 0);
        return dateB - dateA;
      });

      setCongresses(congressEvents);

      // Если только один актуальный конгресс и нет id в URL - сразу открываем
      const upcomingCongresses = congressEvents.filter(c =>
        c.event_date_start && new Date(c.event_date_start) >= new Date()
      );

      if (!id && upcomingCongresses.length === 1) {
        setSelectedCongress(upcomingCongresses[0]);
      } else if (!id && upcomingCongresses.length === 0 && congressEvents.length === 1) {
        // Если нет предстоящих, но есть один прошедший - показываем его
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  // Если не выбран конкретный конгресс - показываем список
  if (!selectedCongress && congresses.length > 1) {
    const upcomingCongresses = congresses.filter(c =>
      c.event_date_start && new Date(c.event_date_start) >= new Date()
    );
    const pastCongresses = congresses.filter(c =>
      !c.event_date_start || new Date(c.event_date_start) < new Date()
    );

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('congress.title', 'Конгрессы')}
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl">
              {t('congress.subtitle', 'Научно-практические мероприятия Ассоциации ревматологов Узбекистана')}
            </p>
          </div>
        </section>

        {/* Congress List */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Upcoming */}
            {upcomingCongresses.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  {t('congress.upcoming', 'Предстоящие конгрессы')}
                </h2>
                <div className="grid gap-6">
                  {upcomingCongresses.map((congress) => (
                    <button
                      key={congress.id}
                      onClick={() => selectCongress(congress)}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow text-left w-full group"
                    >
                      <div className="md:flex">
                        {congress.image_url ? (
                          <div className="md:w-72 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                            <img
                              src={congress.image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="md:w-72 h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="p-6 flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              {t('congress.open', 'Регистрация открыта')}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                            {getLocalizedField(congress, 'title')}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-gray-500 mb-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDateRange(congress.event_date_start, congress.event_date_end)}</span>
                            </div>
                            {congress.event_location_ru && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{getLocalizedField(congress, 'event_location')}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 line-clamp-2">
                            {getLocalizedField(congress, 'excerpt') || getLocalizedField(congress, 'content')?.substring(0, 200)}
                          </p>
                          <div className="mt-4 text-[var(--color-primary)] font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                            {t('congress.details', 'Подробнее')}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Past */}
            {pastCongresses.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('congress.past', 'Прошедшие конгрессы')}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {pastCongresses.map((congress) => (
                    <button
                      key={congress.id}
                      onClick={() => selectCongress(congress)}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left w-full group opacity-80 hover:opacity-100"
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            {t('congress.completed', 'Завершён')}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatDate(congress.event_date_start)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                          {getLocalizedField(congress, 'title')}
                        </h3>
                        {congress.event_location_ru && (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {getLocalizedField(congress, 'event_location')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {congresses.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('congress.noCongresses', 'Конгрессы пока не запланированы')}
                </h3>
                <p className="text-gray-500">
                  {t('congress.checkLater', 'Следите за обновлениями на сайте')}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Показываем детали конгресса (или fallback если конгресс не найден)
  const congress = selectedCongress || {
    title_ru: 'III Конгресс Ревматологов Узбекистана',
    title_uz: "III O'zbekiston revmatologlar kongressi",
    title_en: 'III Congress of Rheumatologists of Uzbekistan',
    content_ru: 'III Конгресс Ревматологов Узбекистана — крупнейшее научно-практическое мероприятие, объединяющее ведущих специалистов в области ревматологии из Узбекистана и зарубежных стран. В программе конгресса: пленарные заседания, симпозиумы, мастер-классы, постерные сессии и круглые столы по актуальным вопросам диагностики и лечения ревматических заболеваний.',
    event_date_start: '2025-05-15',
    event_date_end: '2025-05-17',
    event_location_ru: 'Ташкент, Узбекистан',
    event_location_uz: 'Toshkent, O\'zbekiston',
    event_location_en: 'Tashkent, Uzbekistan',
  };

  const isUpcoming = congress.event_date_start && new Date(congress.event_date_start) >= new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {congresses.length > 1 && (
            <button
              onClick={backToList}
              className="flex items-center gap-2 text-cyan-200 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('congress.backToList', 'Все конгрессы')}
            </button>
          )}
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            isUpcoming ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'
          }`}>
            {isUpcoming ? t('congress.upcoming', 'Предстоящий') : t('congress.completed', 'Завершён')}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
            {getLocalizedField(congress, 'title')}
          </h1>
          <div className="flex flex-wrap gap-6 text-white/90">
            {congress.event_date_start && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDateRange(congress.event_date_start, congress.event_date_end)}</span>
              </div>
            )}
            {congress.event_location_ru && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{getLocalizedField(congress, 'event_location')}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Congress */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
                {t('congress.about', 'О конгрессе')}
              </h2>
              <div
                className="text-[var(--color-text-light)] leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: getLocalizedField(congress, 'content') || '' }}
              />
            </section>

            {/* Program (static for now) */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('congress.program', 'Программа')}</h2>
              <div className="space-y-6">
                {[
                  { day: t('congress.day1', 'День 1'), events: [t('congress.registration', 'Регистрация участников'), t('congress.opening', 'Торжественное открытие'), t('congress.plenary', 'Пленарное заседание')] },
                  { day: t('congress.day2', 'День 2'), events: [t('congress.symposiums', 'Симпозиумы'), t('congress.workshops', 'Мастер-классы'), t('congress.posters', 'Постерная сессия')] },
                  { day: t('congress.day3', 'День 3'), events: [t('congress.roundtables', 'Круглые столы'), t('congress.closing', 'Закрытие конгресса')] },
                ].map((dayProgram, i) => (
                  <div key={i} className="border-l-4 border-[var(--color-primary)] pl-4">
                    <h3 className="font-semibold text-[var(--color-text)] mb-2">{dayProgram.day}</h3>
                    <ul className="space-y-1">
                      {dayProgram.events.map((event, j) => (
                        <li key={j} className="text-sm text-[var(--color-text-light)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
                          {event}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Speakers */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('congress.speakers', 'Спикеры')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex-shrink-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">{t('congress.speaker', 'Спикер')} {i}</h3>
                      <p className="text-sm text-[var(--color-text-light)]">{t('congress.degree', 'д.м.н., профессор')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            {isUpcoming && (
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">
                  {t('congress.register', 'Регистрация')}
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-light)]">{t('congress.status', 'Статус')}:</span>
                    <span className="text-green-600 font-medium">{t('congress.open', 'Открыта')}</span>
                  </div>
                </div>
                {congress.registration_url ? (
                  <a
                    href={congress.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-center"
                  >
                    {t('congress.register', 'Регистрация')}
                  </a>
                ) : (
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {t('congress.register', 'Регистрация')}
                  </button>
                )}
              </div>
            )}

            {/* Venue Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">
                {t('congress.location', 'Место проведения')}
              </h3>
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-light)]">
                {getLocalizedField(congress, 'event_location')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t('congress.registrationForm.title', 'Регистрация на конгресс')}</h2>
              <button onClick={() => setShowRegistration(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.fullName', 'ФИО')} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.email', 'Email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.phone', 'Телефон')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.organization', 'Организация')}
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.position', 'Должность')}
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
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
