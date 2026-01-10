import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contentAPI } from '../services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ru';

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNews();
  }, [id]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contentAPI.getNewsItem(id);
      setNews(res.data);

      // Load related news
      const relatedRes = await contentAPI.getNews(null, true, 0, 4);
      setRelatedNews(relatedRes.data.filter(n => n.id !== parseInt(id)).slice(0, 3));
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
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

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()}-${end.getDate()} ${months[lang][start.getMonth()]} ${start.getFullYear()}`;
    }

    if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${months[lang][start.getMonth()]} - ${end.getDate()} ${months[lang][end.getMonth()]} ${start.getFullYear()}`;
    }

    return `${formatSingle(start)} - ${formatSingle(end)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {lang === 'ru' ? 'Новость не найдена' : lang === 'uz' ? 'Yangilik topilmadi' : 'News not found'}
          </h1>
          <Link to="/news" className="text-cyan-600 hover:underline">
            {lang === 'ru' ? '← Вернуться к новостям' : lang === 'uz' ? "← Yangiliklarга qayтиш" : '← Back to news'}
          </Link>
        </div>
      </div>
    );
  }

  const isEvent = news.news_type === 'event';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="relative h-64 md:h-96 bg-cover bg-center"
        style={{
          backgroundImage: news.background_image_url || news.image_url
            ? `url(http://localhost:8000${news.background_image_url || news.image_url})`
            : 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            {/* Breadcrumb */}
            <Link to="/news" className="text-white/80 hover:text-white text-sm flex items-center gap-1 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lang === 'ru' ? 'Все новости' : lang === 'uz' ? 'Barcha yangiliklar' : 'All news'}
            </Link>

            {/* Type Badge */}
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 ${
              isEvent ? 'bg-orange-500 text-white' : 'bg-cyan-600 text-white'
            }`}>
              {isEvent
                ? (lang === 'ru' ? 'Событие' : lang === 'uz' ? 'Tadbir' : 'Event')
                : (lang === 'ru' ? 'Новость' : lang === 'uz' ? 'Yangilik' : 'News')
              }
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {getLocalizedField(news, 'title')}
            </h1>

            {/* Subtitle for news */}
            {!isEvent && getLocalizedField(news, 'subtitle') && (
              <p className="text-lg text-white/80 mt-2">
                {getLocalizedField(news, 'subtitle')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Info Card */}
        {isEvent && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 -mt-16 relative z-10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Date */}
              {news.event_date_start && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {lang === 'ru' ? 'Дата' : lang === 'uz' ? 'Sana' : 'Date'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatDateRange(news.event_date_start, news.event_date_end)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {getLocalizedField(news, 'event_location') && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {lang === 'ru' ? 'Место' : lang === 'uz' ? 'Joy' : 'Location'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {getLocalizedField(news, 'event_location')}
                    </p>
                  </div>
                </div>
              )}

              {/* Registration */}
              {news.registration_url && (
                <div className="flex items-center">
                  <a
                    href={news.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-center"
                  >
                    {lang === 'ru' ? 'Регистрация' : lang === 'uz' ? "Ro'yxatdan o'tish" : 'Register'}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className={`bg-white rounded-xl shadow-lg overflow-hidden ${isEvent ? '' : '-mt-16 relative z-10'}`}>
          <div className="p-8 md:p-12">
            {/* Meta for news */}
            {!isEvent && (
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <time dateTime={news.created_at}>{formatDate(news.created_at)}</time>
                {news.views_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {news.views_count}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Event Image */}
            {isEvent && news.image_url && (
              <div className="mb-8">
                <img
                  src={`http://localhost:8000${news.image_url}`}
                  alt={getLocalizedField(news, 'title')}
                  className="w-full max-w-lg mx-auto rounded-xl shadow-md"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-cyan-600 prose-strong:text-gray-900">
              <div
                dangerouslySetInnerHTML={{
                  __html: getLocalizedField(news, 'content')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {lang === 'ru' ? 'Поделиться:' : lang === 'uz' ? 'Ulashish:' : 'Share:'}
                </span>
                <div className="flex gap-2">
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(getLocalizedField(news, 'title'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {lang === 'ru' ? 'Другие материалы' : lang === 'uz' ? 'Boshqa materiallar' : 'Related news'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={`http://localhost:8000${item.image_url}`}
                        alt={getLocalizedField(item, 'title')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-teal-600"></div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${
                      item.news_type === 'event'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {item.news_type === 'event'
                        ? (lang === 'ru' ? 'Событие' : lang === 'uz' ? 'Tadbir' : 'Event')
                        : (lang === 'ru' ? 'Новость' : lang === 'uz' ? 'Yangilik' : 'News')
                      }
                    </span>
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {getLocalizedField(item, 'title')}
                    </h3>
                    <time className="text-xs text-gray-500 mt-2 block">
                      {formatDate(item.created_at)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
