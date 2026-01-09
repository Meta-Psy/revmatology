import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { newsAPI } from '../services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);

  useEffect(() => {
    loadNews();
  }, [id]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await newsAPI.getById(id);
      setNews(res.data);

      // Load related news
      const relatedRes = await newsAPI.getAll(0, 3);
      setRelatedNews(relatedRes.data.filter(n => n.id !== parseInt(id)));
    } catch (err) {
      console.error('Error loading news:', err);
      // Mock data for demo
      setNews({
        id: parseInt(id),
        title_ru: 'Анонс III Конгресса Ревматологов Узбекистана',
        title_uz: 'O\'zbekiston Revmatologlar III Kongressi e\'loni',
        title_en: 'Announcement of the III Congress of Rheumatologists of Uzbekistan',
        content_ru: `
## О конгрессе

III Конгресс Ревматологов Узбекистана состоится **15-17 мая 2024 года** в Ташкенте. Это крупнейшее научно-практическое мероприятие, объединяющее ведущих специалистов в области ревматологии.

### Основные темы конгресса:

- Современные подходы к диагностике ревматических заболеваний
- Инновационные методы лечения
- Международный опыт и сотрудничество
- Образовательные программы для специалистов

### Приглашённые спикеры

На конгрессе выступят ведущие специалисты из:
- России
- Европейских стран
- Казахстана
- Кыргызстана

### Регистрация

Регистрация на конгресс уже открыта. Количество мест ограничено.

Для регистрации перейдите в [раздел Конгресс](/congress).
        `,
        content_uz: 'Kongress haqida ma\'lumot o\'zbek tilida...',
        content_en: 'Congress information in English...',
        image_url: null,
        created_at: '2024-01-15T10:00:00',
        author: { full_name: 'Администратор' }
      });

      setRelatedNews([
        { id: 2, title_ru: 'Новые методы диагностики', title_uz: 'Yangi diagnostika', title_en: 'New diagnostics', created_at: '2024-01-10T10:00:00' },
        { id: 3, title_ru: 'Школа ревматологов', title_uz: 'Revmatologlar maktabi', title_en: 'Rheumatology school', created_at: '2024-01-05T10:00:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    const lang = i18n.language;
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Новость не найдена</h1>
          <Link to="/news" className="text-[var(--color-primary)] hover:underline">
            ← Вернуться к новостям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="bg-gradient-to-br from-cyan-600 to-teal-700 h-64 md:h-80">
        {news.image_url ? (
          <img
            src={news.image_url}
            alt={getLocalizedField(news, 'title')}
            className="w-full h-full object-cover opacity-50"
          />
        ) : null}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link to="/news" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('news.allNews')}
          </Link>
        </nav>

        {/* Article Card */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <time dateTime={news.created_at}>{formatDate(news.created_at)}</time>
              {news.author && (
                <>
                  <span>•</span>
                  <span>{news.author.full_name}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
              {getLocalizedField(news, 'title')}
            </h1>

            {/* Content */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-[var(--color-primary)] prose-strong:text-gray-900">
              <div dangerouslySetInnerHTML={{
                __html: getLocalizedField(news, 'content')
                  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/^- (.+)$/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                  .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(.+)$/gm, (match) => {
                    if (match.startsWith('<')) return match;
                    return `<p>${match}</p>`;
                  })
              }} />
            </div>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Поделиться:</span>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Другие новости</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex"
                >
                  <div className="w-32 h-32 bg-gray-200 flex-shrink-0"></div>
                  <div className="p-4 flex flex-col justify-center">
                    <time className="text-xs text-gray-500 mb-1">
                      {formatDate(item.created_at)}
                    </time>
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {getLocalizedField(item, 'title')}
                    </h3>
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
