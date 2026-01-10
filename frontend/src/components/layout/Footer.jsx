import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: '/', label: t('nav.home', 'Главная') },
    { path: '/about/activities', label: t('nav.activities', 'Деятельность') },
    { path: '/congress', label: t('nav.congress', 'Конгресс') },
    { path: '/news', label: t('nav.news', 'Новости') },
  ];

  const resourceLinks = [
    { path: '/documents', label: t('nav.documents', 'Нормативные документы') },
    { path: '/about/centers', label: t('nav.centers', 'Специализированные центры') },
    { path: '/about/schools', label: t('nav.schools', 'Школы') },
    { path: '/about/chief-rheumatologists', label: t('nav.chiefRheumatologists', 'Главные ревматологи') },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>
        {/* Элегантный паттерн */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Верхняя декоративная линия */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      {/* Основной контент */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Верхняя секция */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Логотип и описание */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-4 group mb-6">
              {/* Логотип с элегантной рамкой */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                <div className="relative">
                  <img
                    src="/logo assotsatsiya.png"
                    alt="Ассоциация Ревматологов Узбекистана"
                    className="h-14 w-auto object-contain"
                  />
                </div>
              </div>
              <div>
                <div className="text-white font-medium" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Ассоциация
                </div>
                <div className="text-slate-400 text-sm">
                  Ревматологов Узбекистана
                </div>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <em>{t('about.description', 'Объединяем ведущих специалистов страны для развития ревматологии и улучшения качества жизни пациентов.')}</em>
            </p>

            {/* Социальные сети */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Мы в соцсетях</span>
              {/* Telegram */}
              <a
                href="https://t.me/rheumatology_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:border-sky-500/50 hover:bg-sky-500/10 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com/rheumatology_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com/rheumatology.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com/@rheumatology_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Навигация */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-medium mb-6 flex items-center gap-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span>{t('footer.links', 'Навигация')}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent max-w-[60px]"></div>
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-all duration-300"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ресурсы */}
          <div className="lg:col-span-4">
            <h3 className="text-white font-medium mb-6 flex items-center gap-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span>{t('footer.resources', 'Ресурсы')}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent max-w-[60px]"></div>
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-all duration-300"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors"></span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Контакты */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-4">{t('footer.contacts', 'Контакты')}</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:info@rheumatology.uz"
                    className="group flex items-center gap-3 text-slate-400 hover:text-white text-sm transition-all duration-300"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center group-hover:border-sky-500/30 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span>info@rheumatology.uz</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+998712345678"
                    className="group flex items-center gap-3 text-slate-400 hover:text-white text-sm transition-all duration-300"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center group-hover:border-sky-500/30 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <span>+998 71 234 56 78</span>
                  </a>
                </li>
                <li className="flex items-start gap-3 text-slate-400 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <span>г. Ташкент, Узбекистан</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Нижняя секция */}
        <div className="relative py-6 border-t border-slate-800">
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-slate-700"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-slate-700"></div>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-slate-700"></div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Копирайт */}
            <div className="text-slate-500 text-sm text-center md:text-left">
              © {currentYear} {t('footer.copyright', 'Ассоциация Ревматологов Узбекистана. Все права защищены.')}
            </div>

            {/* Международные партнёры */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-600">Партнёры:</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs font-medium hover:text-slate-400 transition-colors cursor-default">EULAR</span>
                <span className="w-px h-3 bg-slate-700"></span>
                <span className="text-slate-500 text-xs font-medium hover:text-slate-400 transition-colors cursor-default">APLAR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Угловые декоративные элементы */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-sky-500/10 hidden lg:block"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-sky-500/10 hidden lg:block"></div>
    </footer>
  );
};

export default Footer;
