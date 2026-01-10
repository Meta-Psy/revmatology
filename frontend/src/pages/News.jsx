import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const News = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ru';

  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: { ru: 'Все', uz: 'Hammasi', en: 'All' } },
    { id: 'news', label: { ru: 'Новости', uz: 'Yangiliklar', en: 'News' } },
    { id: 'event', label: { ru: 'События', uz: 'Tadbirlar', en: 'Events' } },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featuredRes, newsRes] = await Promise.all([
        contentAPI.getFeaturedNews(10),
        contentAPI.getNews(null, true, 0, 50),
      ]);
      setEvents(featuredRes.data.filter(item => item.news_type === 'event'));
      setNews(newsRes.data);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate carousel
  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  }, [events.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  }, [events.length]);

  const getLocalizedField = (item, field) => {
    return item[`${field}_${lang}`] || item[`${field}_ru`] || '';
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return '';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const months = {
      ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
      uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    };

    const formatSingle = (date) => {
      return `${date.getDate()} ${months[lang][date.getMonth()]} ${date.getFullYear()}`;
    };

    if (!end || start.getTime() === end.getTime()) {
      return formatSingle(start);
    }

    // Same month and year
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()}-${end.getDate()} ${months[lang][start.getMonth()]} ${start.getFullYear()}`;
    }

    // Different months, same year
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${months[lang][start.getMonth()]} - ${end.getDate()} ${months[lang][end.getMonth()]} ${start.getFullYear()}`;
    }

    // Different years
    return `${formatSingle(start)} - ${formatSingle(end)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredNews = selectedFilter === 'all'
    ? news
    : news.filter(item => item.news_type === selectedFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Events Carousel */}
      {events.length > 0 && (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: event.background_image_url
                    ? `url(http://localhost:8000${event.background_image_url})`
                    : 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
                }}
              >
                <div className="absolute inset-0 bg-black/50"></div>
              </div>

              {/* Content */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                  {/* Event Image (Left) */}
                  {event.image_url && (
                    <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
                      <img
                        src={`http://localhost:8000${event.image_url}`}
                        alt={getLocalizedField(event, 'title')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Text Content (Center) */}
                  <div className="flex-1 text-center md:text-left text-white">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">
                      {getLocalizedField(event, 'title')}
                    </h2>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-6 text-white/90 mb-6">
                      {getLocalizedField(event, 'event_location') && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{getLocalizedField(event, 'event_location')}</span>
                        </div>
                      )}
                      {event.event_date_start && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDateRange(event.event_date_start, event.event_date_end)}</span>
                        </div>
                      )}
                    </div>

                    {event.excerpt_ru && (
                      <p className="text-white/80 mb-6 line-clamp-2 max-w-2xl">
                        {getLocalizedField(event, 'excerpt')}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                      {event.registration_url && (
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-white text-cyan-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {lang === 'ru' ? 'Регистрация' : lang === 'uz' ? "Ro'yxatdan o'tish" : 'Register'}
                        </a>
                      )}
                      <Link
                        to={`/news/${event.id}`}
                        className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {lang === 'ru' ? 'Подробнее' : lang === 'uz' ? 'Batafsil' : 'Learn More'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          {events.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
          {events.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* News Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
            {lang === 'ru' ? 'Новости и события' : lang === 'uz' ? 'Yangiliklar va tadbirlar' : 'News & Events'}
          </h2>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.label[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {lang === 'ru' ? 'Новости не найдены' : lang === 'uz' ? 'Yangiliklar topilmadi' : 'No news found'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={`http://localhost:8000${item.image_url}`}
                      alt={getLocalizedField(item, 'title')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-teal-600"></div>
                  )}
                  {/* Type Badge */}
                  <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full ${
                    item.news_type === 'event'
                      ? 'bg-orange-500 text-white'
                      : 'bg-cyan-600 text-white'
                  }`}>
                    {item.news_type === 'event'
                      ? (lang === 'ru' ? 'Событие' : lang === 'uz' ? 'Tadbir' : 'Event')
                      : (lang === 'ru' ? 'Новость' : lang === 'uz' ? 'Yangilik' : 'News')
                    }
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {item.news_type === 'event' && item.event_date_start
                      ? formatDateRange(item.event_date_start, item.event_date_end)
                      : formatDate(item.created_at)
                    }
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {getLocalizedField(item, 'title')}
                  </h3>

                  {/* Subtitle or Excerpt */}
                  {(getLocalizedField(item, 'subtitle') || getLocalizedField(item, 'excerpt')) && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {getLocalizedField(item, 'subtitle') || getLocalizedField(item, 'excerpt')}
                    </p>
                  )}

                  {/* Event Location */}
                  {item.news_type === 'event' && getLocalizedField(item, 'event_location') && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {getLocalizedField(item, 'event_location')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/news/${item.id}`}
                      className="text-cyan-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {lang === 'ru' ? 'Подробнее' : lang === 'uz' ? 'Batafsil' : 'Read More'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {item.news_type === 'event' && item.registration_url && (
                      <a
                        href={item.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        {lang === 'ru' ? 'Регистрация' : lang === 'uz' ? "Ro'yxatdan o'tish" : 'Register'}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View Counter Info */}
        {filteredNews.length > 0 && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            {lang === 'ru'
              ? `Показано ${filteredNews.length} материалов`
              : lang === 'uz'
              ? `${filteredNews.length} ta material ko'rsatilmoqda`
              : `Showing ${filteredNews.length} items`
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
