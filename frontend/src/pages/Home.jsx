import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-600 to-teal-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#about"
                className="px-8 py-3 bg-white text-cyan-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('hero.learnMore')}
              </a>
              <Link
                to="/register"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyan-700 transition-colors"
              >
                {t('hero.joinUs')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              {t('about.title')}
            </h2>
            <div className="w-24 h-1 bg-[var(--color-primary)] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-[var(--color-text-light)] leading-relaxed mb-6">
                {t('about.description')}
              </p>
              <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3">
                {t('about.mission')}
              </h3>
              <p className="text-[var(--color-text-light)] leading-relaxed">
                {t('about.missionText')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-primary)]">50+</div>
                  <div className="text-sm text-[var(--color-text-light)] mt-1">Специалистов</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-primary)]">10+</div>
                  <div className="text-sm text-[var(--color-text-light)] mt-1">Центров</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-primary)]">5+</div>
                  <div className="text-sm text-[var(--color-text-light)] mt-1">Партнёров</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-primary)]">1000+</div>
                  <div className="text-sm text-[var(--color-text-light)] mt-1">Пациентов</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              {t('members.title')}
            </h2>
            <p className="text-[var(--color-text-light)]">{t('members.subtitle')}</p>
            <div className="w-24 h-1 bg-[var(--color-primary)] mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-[var(--color-text)]">Член ассоциации</h3>
                <p className="text-sm text-[var(--color-text-light)]">Должность</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* International Cooperation */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              {t('cooperation.title')}
            </h2>
            <p className="text-[var(--color-text-light)]">{t('cooperation.subtitle')}</p>
            <div className="w-24 h-1 bg-[var(--color-primary)] mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 flex items-center justify-center h-32 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm text-[var(--color-text-light)]">Партнёр {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charter Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-cyan-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('charter.title')}</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">{t('charter.description')}</p>
          <button className="px-8 py-3 bg-white text-cyan-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('charter.download')}
          </button>
        </div>
      </section>

      {/* News Preview */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
                {t('news.latest')}
              </h2>
              <div className="w-24 h-1 bg-[var(--color-primary)]"></div>
            </div>
            <Link
              to="/news"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              {t('news.allNews')} →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <article key={i} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="text-sm text-[var(--color-text-light)] mb-2">01.01.2024</div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">Заголовок новости {i}</h3>
                  <p className="text-sm text-[var(--color-text-light)] mb-4">
                    Краткое описание новости. Здесь будет текст превью новости...
                  </p>
                  <Link
                    to={`/news/${i}`}
                    className="text-[var(--color-primary)] text-sm font-medium hover:underline"
                  >
                    {t('news.readMore')} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
