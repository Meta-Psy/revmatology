import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const News = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'events', label: 'Мероприятия' },
    { id: 'science', label: 'Наука' },
    { id: 'education', label: 'Образование' },
  ];

  const newsItems = [
    {
      id: 1,
      title: 'Анонс III Конгресса Ревматологов Узбекистана',
      excerpt: 'III Конгресс Ревматологов Узбекистана состоится 15-17 мая 2024 года в Ташкенте.',
      date: '15.01.2024',
      category: 'events',
    },
    {
      id: 2,
      title: 'Новые методы диагностики ревматоидного артрита',
      excerpt: 'Обзор современных подходов к ранней диагностике ревматоидного артрита.',
      date: '10.01.2024',
      category: 'science',
    },
    {
      id: 3,
      title: 'Школа ревматологов: набор на весенний курс',
      excerpt: 'Открыт набор на весенний курс повышения квалификации для врачей-ревматологов.',
      date: '05.01.2024',
      category: 'education',
    },
    {
      id: 4,
      title: 'Международное сотрудничество: визит делегации из России',
      excerpt: 'Делегация Ассоциации ревматологов России посетила Узбекистан.',
      date: '01.01.2024',
      category: 'events',
    },
    {
      id: 5,
      title: 'Обновлённые клинические рекомендации по лечению СКВ',
      excerpt: 'Опубликованы новые национальные клинические рекомендации по лечению СКВ.',
      date: '28.12.2023',
      category: 'science',
    },
    {
      id: 6,
      title: 'Школа для пациентов: итоги 2023 года',
      excerpt: 'Подведены итоги работы Школы для пациентов в 2023 году.',
      date: '25.12.2023',
      category: 'education',
    },
  ];

  const filteredNews = selectedCategory === 'all'
    ? newsItems
    : newsItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('news.title')}</h1>
          <p className="text-white/80 max-w-2xl">
            Актуальные новости из мира ревматологии: события, исследования, образовательные программы.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-[var(--color-primary)] bg-cyan-50 px-2 py-1 rounded">
                    {categories.find((c) => c.id === news.category)?.label}
                  </span>
                  <span className="text-sm text-[var(--color-text-light)]">{news.date}</span>
                </div>
                <h2 className="font-semibold text-[var(--color-text)] mb-2 line-clamp-2">
                  {news.title}
                </h2>
                <p className="text-sm text-[var(--color-text-light)] mb-4 line-clamp-3">
                  {news.excerpt}
                </p>
                <Link
                  to={`/news/${news.id}`}
                  className="text-[var(--color-primary)] text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  {t('news.readMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <button className="px-8 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] font-medium rounded-lg hover:bg-cyan-50 transition-colors">
            Загрузить ещё
          </button>
        </div>
      </div>
    </div>
  );
};

export default News;
