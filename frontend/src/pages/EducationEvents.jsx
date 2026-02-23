import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const EducationEvents = ({ eventType = 'masterclass' }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const i18nPrefix = eventType === 'webinar' ? 'webinarsPage' : 'masterclassesPage';

  useEffect(() => {
    loadData();
  }, [eventType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await contentAPI.getEducationEvents(eventType);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading education events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US';
    const options = { day: 'numeric', month: 'long' };

    if (end && start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    } else if (end) {
      return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, { ...options, year: 'numeric' })}`;
    }
    return start.toLocaleDateString(locale, { ...options, year: 'numeric' });
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
              {t(`${i18nPrefix}.title`)}
            </span>
          </nav>

          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-sky-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                {t(`${i18nPrefix}.title`)}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {t(`${i18nPrefix}.subtitle`)}
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
          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                {t(`${i18nPrefix}.noEvents`)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-stone-200/60 hover:shadow-lg hover:border-stone-300 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Event image */}
                  {event.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={`http://localhost:8000${event.image_url}`}
                        alt={getField(event, 'title')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Background number */}
                    <div className="absolute top-4 right-4 text-5xl font-light text-stone-100 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg text-stone-800 mb-3 leading-snug relative" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {getField(event, 'title')}
                    </h3>

                    {/* Separator */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-px bg-gradient-to-r from-sky-400/50 to-transparent"></div>
                      <div className="w-1 h-1 rotate-45 bg-sky-400/50"></div>
                    </div>

                    {/* Description */}
                    {getField(event, 'description') && (
                      <p className="text-stone-500 text-sm leading-relaxed mb-4 line-clamp-3" style={{ fontFamily: 'Georgia, serif' }}>
                        {getField(event, 'description')}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="space-y-2.5 mb-5 mt-auto">
                      {/* Date range */}
                      {(event.date_start || event.event_date_start) && (
                        <div className="flex items-center gap-2.5 text-stone-500 text-sm">
                          <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span style={{ fontFamily: 'Georgia, serif' }}>
                            {formatDateRange(event.date_start || event.event_date_start, event.date_end || event.event_date_end)}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {getField(event, 'location') && (
                        <div className="flex items-center gap-2.5 text-stone-500 text-sm">
                          <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span style={{ fontFamily: 'Georgia, serif' }}>
                            {getField(event, 'location')}
                          </span>
                        </div>
                      )}

                      {/* Speaker */}
                      {getField(event, 'speaker') && (
                        <div className="flex items-center gap-2.5 text-stone-500 text-sm">
                          <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span style={{ fontFamily: 'Georgia, serif' }}>
                            {getField(event, 'speaker')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registration button */}
                    {event.registration_url && (
                      <a
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                      >
                        <span>{t(`${i18nPrefix}.register`, 'Зарегистрироваться')}</span>
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    )}
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

export default EducationEvents;
