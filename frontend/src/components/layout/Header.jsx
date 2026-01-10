import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef(null);
  const userRef = useRef(null);
  const aboutRef = useRef(null);
  const aboutTimeoutRef = useRef(null);

  // Отслеживание скролла для эффекта
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Подменю "О центре"
  const aboutSubmenu = [
    { path: '/about/activities', label: t('nav.activities', 'Деятельность') },
    { path: '/about/centers', label: t('nav.centers', 'Специализированные центры') },
    { path: '/about/chief-rheumatologists', label: t('nav.chiefRheumatologists', 'Главные ревматологи') },
    { path: '/about/schools', label: t('nav.schools', 'Школы') },
  ];

  const navLinks = [
    { path: '/about', label: t('nav.about', 'О центре'), hasSubmenu: true },
    { path: '/documents', label: t('nav.documents', 'Нормативные документы') },
    { path: '/congress', label: t('nav.congress') },
    { path: '/news', label: t('nav.news') },
  ];

  // SVG флаги для Windows совместимости
  const FlagRU = () => (
    <svg className="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
      <rect width="640" height="160" fill="#fff"/>
      <rect y="160" width="640" height="160" fill="#0039a6"/>
      <rect y="320" width="640" height="160" fill="#d52b1e"/>
    </svg>
  );

  const FlagUZ = () => (
    <svg className="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
      <rect width="640" height="160" fill="#0099b5"/>
      <rect y="160" width="640" height="20" fill="#ce1126"/>
      <rect y="180" width="640" height="140" fill="#fff"/>
      <rect y="320" width="640" height="20" fill="#ce1126"/>
      <rect y="340" width="640" height="140" fill="#1eb53a"/>
      <circle cx="134" cy="80" r="40" fill="#fff"/>
      <circle cx="148" cy="80" r="32" fill="#0099b5"/>
    </svg>
  );

  const FlagEN = () => (
    <svg className="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
      <rect width="640" height="480" fill="#012169"/>
      <path d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" fill="#fff"/>
      <path d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" fill="#C8102E"/>
      <path d="M241 0v480h160V0H241zM0 160v160h640V160H0z" fill="#fff"/>
      <path d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" fill="#C8102E"/>
    </svg>
  );

  const languages = [
    { code: 'ru', label: 'Русский', Flag: FlagRU },
    { code: 'uz', label: "O'zbekcha", Flag: FlagUZ },
    { code: 'en', label: 'English', Flag: FlagEN },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const isActive = (path) => {
    if (path === '/about') {
      return location.pathname.startsWith('/about') && location.pathname !== '/about/documents';
    }
    if (path === '/documents') {
      return location.pathname === '/documents' || location.pathname === '/about/documents';
    }
    return location.pathname === path;
  };

  const isSubmenuActive = (path) => location.pathname === path;

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setAboutDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setLangOpen(false);
  };

  // Обработчики для hover на десктопе
  const handleAboutMouseEnter = () => {
    if (aboutTimeoutRef.current) {
      clearTimeout(aboutTimeoutRef.current);
    }
    setAboutDropdownOpen(true);
  };

  const handleAboutMouseLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => {
      setAboutDropdownOpen(false);
    }, 150);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/98 backdrop-blur-xl shadow-lg shadow-slate-900/30'
          : 'bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-lg'
      }`}
    >
      {/* Тонкая декоративная линия сверху */}
      <div className={`absolute top-0 left-0 right-0 h-px transition-opacity duration-500 ${
        scrolled ? 'opacity-100' : 'opacity-70'
      } bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20`}></div>

      {/* Лёгкое свечение снизу для глубины */}
      <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none transition-opacity duration-500 ${
        scrolled ? 'opacity-0' : 'opacity-30'
      }`}></div>

      {/* Нижняя граница */}
      <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${
        scrolled ? 'opacity-100' : 'opacity-60'
      } bg-gradient-to-r from-transparent via-slate-600/60 to-transparent`}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Логотип */}
          <Link to="/" className="flex items-center gap-4 group" title="На главную">
            {/* Контейнер логотипа с элегантной рамкой */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
              <div className="relative">
                <img
                  src="/logo assotsatsiya.png"
                  alt="Ассоциация Ревматологов Узбекистана"
                  className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
            {/* Название - скрыто на мобильных */}
            <div className="hidden xl:block">
              <div className="text-white text-sm font-medium leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Ассоциация
              </div>
              <div className="text-slate-400 text-xs tracking-wide">
                Ревматологов Узбекистана
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            {/* Декоративный элемент слева от навигации */}
            <div className="w-px h-6 bg-slate-700/50 mr-6"></div>

            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                link.hasSubmenu ? (
                  // Dropdown menu для "О центре"
                  <div
                    key={link.path}
                    ref={aboutRef}
                    className="relative"
                    onMouseEnter={handleAboutMouseEnter}
                    onMouseLeave={handleAboutMouseLeave}
                  >
                    <button
                      className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-300 flex items-center gap-1.5 rounded-lg ${
                        isActive(link.path)
                          ? 'text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span style={{ fontFamily: isActive(link.path) ? 'Georgia, "Times New Roman", serif' : 'inherit' }}>
                        {link.label}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${aboutDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {isActive(link.path) && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></span>
                      )}
                    </button>

                    {/* Dropdown с элегантным оформлением */}
                    <div className={`absolute top-full left-0 mt-2 w-72 transition-all duration-300 ${
                      aboutDropdownOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    }`}>
                      {/* Стрелка */}
                      <div className="absolute -top-2 left-8 w-4 h-4 bg-white rotate-45 border-t border-l border-slate-200"></div>

                      <div className="relative bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden">
                        {/* Декоративная линия сверху */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500"></div>

                        <div className="p-2 pt-3">
                          {aboutSubmenu.map((item, index) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setAboutDropdownOpen(false)}
                              className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isSubmenuActive(item.path)
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                isSubmenuActive(item.path)
                                  ? 'bg-sky-500'
                                  : 'bg-slate-300 group-hover:bg-sky-400'
                              }`}></span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg ${
                      isActive(link.path)
                        ? 'text-sky-400'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span style={{ fontFamily: isActive(link.path) ? 'Georgia, "Times New Roman", serif' : 'inherit' }}>
                      {link.label}
                    </span>
                    {isActive(link.path) && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></span>
                    )}
                  </Link>
                )
              ))}
            </div>

            {/* Декоративный элемент справа от навигации */}
            <div className="w-px h-6 bg-slate-700/50 ml-6"></div>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Язык */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
                  langOpen
                    ? 'bg-slate-700/80 border-slate-600'
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                }`}
              >
                <currentLang.Flag />
                <span className="text-sm font-medium text-slate-200 hidden sm:block">{currentLang.code.toUpperCase()}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Language Dropdown */}
              <div className={`absolute right-0 mt-2 w-48 transition-all duration-300 ${
                langOpen
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-2'
              }`}>
                <div className="relative bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500"></div>
                  <div className="p-1.5 pt-2.5">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                          lang.code === i18n.language
                            ? 'bg-sky-50 text-sky-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <lang.Flag />
                        <span className="font-medium text-sm">{lang.label}</span>
                        {lang.code === i18n.language && (
                          <svg className="w-4 h-4 ml-auto text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Разделитель */}
            <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>

            {/* Авторизация */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-300"
                >
                  {/* Аватар с элегантной рамкой */}
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full opacity-80"></div>
                    <div className="relative w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-semibold text-sm">
                      {user.first_name?.charAt(0)?.toUpperCase() || user.last_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white leading-tight">
                      {user.short_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {isAdmin ? 'Администратор' : 'Участник'}
                    </div>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown */}
                <div className={`absolute right-0 mt-2 w-64 transition-all duration-300 ${
                  userMenuOpen
                    ? 'opacity-100 visible translate-y-0'
                    : 'opacity-0 invisible -translate-y-2'
                }`}>
                  <div className="relative bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500"></div>

                    {/* User info header */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                      <div className="font-medium text-slate-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {user.full_name || `${user.last_name} ${user.first_name}`}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">{user.email}</div>
                    </div>

                    <div className="p-1.5">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-sm">Админ-панель</span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                      >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-sm">{t('nav.profile')}</span>
                      </Link>

                      <div className="my-1.5 mx-3 border-t border-slate-100"></div>

                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-sm">{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-300"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="group relative px-5 py-2.5 text-sm font-medium text-white rounded-lg overflow-hidden transition-all duration-300"
                >
                  {/* Градиентный фон */}
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300 group-hover:from-sky-400 group-hover:to-blue-500"></div>
                  {/* Свечение */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-sky-400/50 to-blue-500/50 blur-xl"></div>
                  <span className="relative">{t('nav.register')}</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
            >
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${
        mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-700/50">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              link.hasSubmenu ? (
                <div key={link.path}>
                  <button
                    onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive(link.path)
                        ? 'bg-slate-700/80 text-sky-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${mobileAboutOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    mobileAboutOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pl-4 mt-1 space-y-1">
                      {aboutSubmenu.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isSubmenuActive(item.path)
                              ? 'bg-slate-700/80 text-sky-400'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isSubmenuActive(item.path) ? 'bg-sky-400' : 'bg-slate-500'
                          }`}></span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-slate-700/80 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
