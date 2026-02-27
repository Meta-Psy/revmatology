import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentAPI } from '../services/api';
import { useHeroImage } from '../hooks/useHeroImage';

// Хук для отслеживания видимости элемента
const useInView = (options = {}) => {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px' } = options;
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin]);

  return [ref, isInView];
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;

  const [partners, setPartners] = useState([]);
  const [news, setNews] = useState([]);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [charter, setCharter] = useState(null);
  const [loading, setLoading] = useState(true);
  const heroImage = useHeroImage('home');

  // Refs для анимаций секций (только для статичных секций)
  const [aboutRef, aboutInView] = useInView();
  const [missionRef, missionInView] = useInView();
  const [activitiesRef, activitiesInView] = useInView();
  const [newsRef, newsInView] = useInView();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partnersRes, newsRes, eventsRes, charterRes] = await Promise.all([
        contentAPI.getPartners().catch(() => ({ data: [] })),
        contentAPI.getNews(null, true, 0, 3).catch(() => ({ data: [] })),
        contentAPI.getNews('event', true, 0, 1).catch(() => ({ data: [] })),
        contentAPI.getCharter().catch(() => ({ data: null }))
      ]);

      setPartners(partnersRes.data || []);
      setNews(newsRes.data || []);
      setUpcomingEvent(eventsRes.data?.[0] || null);
      setCharter(charterRes.data || null);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  // Hero для гостей (не авторизованных)
  const GuestHero = () => (
    <section className="relative bg-slate-900 overflow-hidden">
      {/* Фоновое изображение */}
      <div className="absolute inset-0">
        <img
          src={heroImage || '/hero-bg.jpg'}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Градиентный оверлей: плотный слева (текст) → полупрозрачный справа (фото) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/60 lg:to-slate-900/40"></div>
        {/* Дополнительный вертикальный градиент для мобильных — усиленная читаемость */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-900/90 lg:from-transparent lg:via-transparent lg:to-slate-900/30"></div>
      </div>

      {/* Декоративные элементы */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 md:w-80 h-48 md:h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        {/* Элегантный паттерн - ромбы вместо точек */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Тонкие угловые акценты - скрыты на мобильных */}
      <div className="hidden sm:block absolute top-8 left-8 w-12 md:w-16 h-12 md:h-16 border-t border-l border-sky-500/20"></div>
      <div className="hidden sm:block absolute top-8 right-8 w-12 md:w-16 h-12 md:h-16 border-t border-r border-sky-500/20"></div>
      <div className="hidden sm:block absolute bottom-8 left-8 w-12 md:w-16 h-12 md:h-16 border-b border-l border-blue-500/20"></div>
      <div className="hidden sm:block absolute bottom-8 right-8 w-12 md:w-16 h-12 md:h-16 border-b border-r border-blue-500/20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Левая часть - текст */}
          <div className="text-center lg:text-left">
            {/* Декоративный элемент над заголовком */}
            <div className="flex items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-sky-500/60 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-sky-400/60"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 font-light">
                {t('hero.titleHighlight', 'Ассоциация')}
              </span>
              <br />
              <span className="font-normal">{t('hero.titleMain', 'Ревматологов Узбекистана')}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('hero.joinUs', 'Присоединиться')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#about"
                className="group px-6 sm:px-8 py-3.5 sm:py-4 border border-slate-600/80 text-slate-300 hover:border-sky-500/50 hover:text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('hero.learnMore', 'Узнать больше')}
                <svg className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Правая часть - визуальный элемент (Desktop) */}
          <div className="hidden lg:block relative">
            {/* Соединительная линия к левой части */}
            <div className="absolute left-0 top-1/2 w-12 h-px bg-gradient-to-r from-slate-700/40 to-transparent -translate-x-full"></div>

            <div className="relative">
              {/* Фоновые круги с мягкой анимацией */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Внешний круг - медленное вращение */}
                <div className="w-80 h-80 border border-slate-700/60 rounded-full animate-[spin_60s_linear_infinite]"></div>
                {/* Средний круг - обратное вращение */}
                <div className="absolute w-64 h-64 border border-slate-700/40 rounded-full animate-[spin_45s_linear_infinite_reverse]"></div>
                {/* Внутренний круг - статичный с градиентом */}
                <div className="absolute w-48 h-48 border border-sky-500/20 rounded-full"></div>
                {/* Центральный пульсирующий элемент */}
                <div className="absolute w-3 h-3 bg-sky-400/40 rounded-full animate-pulse"></div>
                {/* Декоративные точки на кругах */}
                <div className="absolute w-2 h-2 bg-sky-400/60 rounded-full animate-pulse" style={{ top: '10%', right: '30%' }}></div>
                <div className="absolute w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse" style={{ bottom: '20%', left: '25%', animationDelay: '1s' }}></div>
                <div className="absolute w-1.5 h-1.5 bg-sky-300/30 rounded-full animate-pulse" style={{ top: '35%', left: '10%', animationDelay: '0.5s' }}></div>
              </div>

              {/* Карточки с улучшенным позиционированием и stagger эффектом */}
              <div className="relative z-10 space-y-5 p-6">
                {/* Карточка 1 - смещена вправо */}
                <div className="group bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-lg p-4 ml-auto w-72 transform hover:scale-[1.02] hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 translate-x-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-500/20 group-hover:border-sky-400/40 transition-colors">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{t('hero.card1.title', 'Ведущие центры')}</div>
                      <div className="text-slate-400 text-xs">{t('hero.card1.desc', 'По всей стране')}</div>
                    </div>
                  </div>
                </div>

                {/* Карточка 2 - центрирована, чуть смещена влево */}
                <div className="group bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-lg p-4 w-72 transform hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 -translate-x-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:border-blue-400/40 transition-colors">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{t('hero.card2.title', 'Образование')}</div>
                      <div className="text-slate-400 text-xs">{t('hero.card2.desc', 'Школы и конференции')}</div>
                    </div>
                  </div>
                </div>

                {/* Карточка 3 - смещена вправо */}
                <div className="group bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-lg p-4 ml-auto w-72 transform hover:scale-[1.02] hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 translate-x-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-500/20 group-hover:border-sky-400/40 transition-colors">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{t('hero.card3.title', 'Международное сотрудничество')}</div>
                      <div className="text-slate-400 text-xs">{t('hero.card3.desc', 'EULAR, APLAR и др.')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Мобильные карточки - горизонтальный скролл */}
        <div className="lg:hidden mt-10 -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Карточка 1 */}
            <div className="flex-shrink-0 w-[280px] snap-start bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t('hero.card1.title', 'Ведущие центры')}</div>
                  <div className="text-slate-400 text-xs">{t('hero.card1.desc', 'По всей стране')}</div>
                </div>
              </div>
            </div>

            {/* Карточка 2 */}
            <div className="flex-shrink-0 w-[280px] snap-start bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t('hero.card2.title', 'Образование')}</div>
                  <div className="text-slate-400 text-xs">{t('hero.card2.desc', 'Школы и конференции')}</div>
                </div>
              </div>
            </div>

            {/* Карточка 3 */}
            <div className="flex-shrink-0 w-[280px] snap-start bg-slate-800/70 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t('hero.card3.title', 'Международное сотрудничество')}</div>
                  <div className="text-slate-400 text-xs">{t('hero.card3.desc', 'EULAR, APLAR и др.')}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Индикатор скролла */}
          <div className="flex justify-center gap-1.5 mt-2">
            <div className="w-6 h-1 bg-sky-500/60 rounded-full"></div>
            <div className="w-1.5 h-1 bg-slate-600 rounded-full"></div>
            <div className="w-1.5 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );

  // Hero для авторизованных пользователей
  const UserHero = () => (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        {/* Элегантный паттерн */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Угловые акценты */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-sky-500/20"></div>
      <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-sky-500/20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          {/* Декоративный элемент */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-sky-500/50"></div>
            <div className="w-1 h-1 rotate-45 bg-sky-400/50"></div>
          </div>

          {/* Приветствие */}
          <h1 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('hero.welcomeBack', 'Добро пожаловать')},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
              {user?.short_name || user?.first_name || 'Коллега'}
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-10" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('hero.memberGreeting', 'Рады видеть вас в Ассоциации Ревматологов Узбекистана')}
          </p>

          {/* Информационный блок о событии */}
          {upcomingEvent && (
            <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-lg p-6 md:p-8">
              {/* Угловой акцент на карточке */}
              <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-sky-500/40"></div>
              <div className="absolute -bottom-px -right-px w-8 h-8 border-b border-r border-blue-500/40"></div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                  <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                    {t('hero.event.upcoming', 'Ближайшее событие')}
                  </div>
                  <h2 className="text-xl md:text-2xl text-white mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {getField(upcomingEvent, 'title')}
                  </h2>
                  <p className="text-slate-400 mb-4">
                    {upcomingEvent.event_date && new Date(upcomingEvent.event_date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', { month: 'long', year: 'numeric' })}
                    {getField(upcomingEvent, 'event_location') && ` • ${getField(upcomingEvent, 'event_location')}`}
                  </p>
                  <Link
                    to={`/news/${upcomingEvent.id}`}
                    className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium transition-colors group"
                  >
                    {t('hero.event.details', 'Подробнее')}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div>
      {/* Hero Section - условный рендеринг */}
      {user ? <UserHero /> : <GuestHero />}

      {/* Об ассоциации - Компактный дизайн */}
      <section
        ref={aboutRef}
        id="about"
        className={`relative overflow-hidden py-12 sm:py-16 md:py-20 transition-all duration-700 ease-out ${
          aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Фоновый градиент */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-stone-50/50 to-white"></div>

        {/* Современный акцент - мягкое свечение */}
        <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок секции */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-transparent to-amber-600/40"></div>
              <span className="text-amber-700/70 text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                {t('about.label', 'О нас')}
              </span>
              <div className="w-6 sm:w-8 h-px bg-gradient-to-l from-transparent to-amber-600/40"></div>
            </div>
            <p className="text-base sm:text-lg text-stone-500 max-w-2xl mx-auto px-2" style={{ fontFamily: 'Georgia, serif' }}>
              <em>{t('about.mission', 'Объединяя лучших специалистов страны для развития ревматологии и улучшения качества жизни пациентов')}</em>
            </p>
          </div>

          {/* Основной контент - компактная сетка */}
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">

            {/* Левая колонка - Логотип */}
            <div className="lg:col-span-4">
              <div className="relative group/logo max-w-[200px] sm:max-w-[280px] mx-auto">
                {/* Рамка */}
                <div className="absolute -inset-2 sm:-inset-3 border border-stone-200/60 group-hover/logo:border-stone-300/80 transition-colors duration-500"></div>

                {/* Угловые акценты */}
                <div className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 w-4 sm:w-6 h-4 sm:h-6 border-t-2 border-l-2 border-amber-600/50"></div>
                <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-4 sm:w-6 h-4 sm:h-6 border-t-2 border-r-2 border-amber-600/50"></div>
                <div className="absolute -bottom-2 sm:-bottom-3 -left-2 sm:-left-3 w-4 sm:w-6 h-4 sm:h-6 border-b-2 border-l-2 border-amber-600/50"></div>
                <div className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 w-4 sm:w-6 h-4 sm:h-6 border-b-2 border-r-2 border-amber-600/50"></div>

                {/* Логотип */}
                <div className="relative bg-gradient-to-br from-white to-stone-50 p-4 sm:p-6 shadow-sm group-hover/logo:shadow-md transition-shadow duration-500">
                  <img
                    src="/logo assotsatsiya.png"
                    alt="Ассоциация Ревматологов Узбекистана"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* Статистика - горизонтальная */}
              <div className="flex justify-center gap-6 sm:gap-8 mt-6 sm:mt-8">
                {[
                  { number: '14', suffix: '+', label: t('about.stats.regions', 'Регионов') },
                  { number: '100', suffix: '+', label: t('about.stats.doctors', 'Врачей') },
                  { number: '10', suffix: '+', label: t('about.stats.years', 'Лет') }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl sm:text-3xl font-light text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                        {stat.number}
                      </span>
                      <span className="text-base sm:text-lg text-amber-600 ml-0.5">{stat.suffix}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая колонка - Текст и направления */}
            <div className="lg:col-span-8">
              {/* Текст */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-stone-600 leading-relaxed text-sm sm:text-base" style={{ fontFamily: 'Georgia, serif' }}>
                <p>
                  <span className="text-3xl sm:text-4xl float-left mr-2 mt-0.5 sm:mt-1 text-amber-700/80 leading-none" style={{ fontFamily: 'Georgia, serif' }}>А</span>
                  {t('about.history.text1', 'ссоциация ревматологов Узбекистана была основана с целью объединения специалистов в области ревматологии для развития научной и клинической практики в стране.')}
                </p>
                <p className="hidden sm:block">
                  {t('about.history.text2', 'На протяжении своей деятельности ассоциация активно способствует повышению квалификации врачей, внедрению современных методов диагностики и лечения ревматических заболеваний, а также развитию международного сотрудничества.')}
                </p>
                <p className="hidden md:block">
                  {t('about.history.text3', 'Сегодня ассоциация объединяет ведущих специалистов страны и является важной платформой для обмена опытом и знаниями в области ревматологии.')}
                </p>
              </div>

              {/* Ключевые направления - компактные */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                {[
                  {
                    icon: <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>,
                    title: t('about.directions.education', 'Образование')
                  },
                  {
                    icon: <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" /></svg>,
                    title: t('about.directions.science', 'Наука')
                  },
                  {
                    icon: <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" /></svg>,
                    title: t('about.directions.cooperation', 'Сотрудничество')
                  },
                  {
                    icon: <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477" /></svg>,
                    title: t('about.directions.community', 'Сообщество')
                  }
                ].map((item, i) => (
                  <div key={i} className="group flex flex-col items-center p-2 sm:p-3 rounded-xl border border-transparent hover:border-stone-200 hover:bg-white/80 hover:shadow-sm transition-all duration-300">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 group-hover:border-sky-400/50 group-hover:text-sky-600 group-hover:bg-sky-50/50 transition-all duration-300 mb-1 sm:mb-2">
                      {item.icon}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-stone-700 text-center leading-tight">{item.title}</div>
                  </div>
                ))}
              </div>

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link
                  to="/about"
                  className="group inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 hover:shadow-lg hover:shadow-stone-800/20 transition-all duration-300"
                >
                  <span>{t('common.learnMore', 'Подробнее')}</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {charter?.file_url && (
                  <a
                    href={charter.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 border border-stone-300 text-stone-700 text-sm rounded-lg hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/30 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{t('about.charter.button', 'Устав')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Миссия / Цель ассоциации */}
      <section
        ref={missionRef}
        className={`relative py-16 md:py-20 overflow-hidden transition-all duration-700 ease-out ${
          missionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Градиентный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-sky-500/[0.05] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-blue-500/[0.05] rounded-full blur-3xl"></div>
          {/* Тонкий паттерн */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Угловые акценты */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-sky-500/20 hidden lg:block"></div>
        <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-sky-500/20 hidden lg:block"></div>
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-blue-500/20 hidden lg:block"></div>
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-blue-500/20 hidden lg:block"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Декоративный элемент сверху */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <div className="w-2 h-2 rotate-45 border border-amber-400/50"></div>
              <div className="w-10 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>

            {/* Иконка цели */}
            <div className="w-14 h-14 mx-auto mb-6 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            {/* Заголовок */}
            <h2 className="text-2xl md:text-3xl text-white mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {t('mission.title', 'Основная цель')}
            </h2>

            {/* Подзаголовок */}
            <p className="text-sky-400/80 text-sm uppercase tracking-[0.2em] mb-8" style={{ fontFamily: 'Georgia, serif' }}>
              {t('mission.subtitle', 'Ассоциации ревматологов Узбекистана')}
            </p>

            {/* Тонкий разделитель */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            </div>

            {/* Текст миссии */}
            <div className="relative">
              {/* Декоративные кавычки */}
              <div className="absolute -top-4 left-0 md:left-8 text-6xl text-slate-700/50 leading-none select-none" style={{ fontFamily: 'Georgia, serif' }}>
                "
              </div>
              <div className="absolute -bottom-8 right-0 md:right-8 text-6xl text-slate-700/50 leading-none select-none rotate-180" style={{ fontFamily: 'Georgia, serif' }}>
                "
              </div>

              <p className="text-slate-300 text-lg md:text-xl leading-relaxed px-4 md:px-16" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('mission.text', 'Содействие развитию медицинской науки и практики в целях сохранения и укрепления здоровья населения, создание системы оказания квалифицированной ревматологической помощи населению нашей страны, соответствующей мировым стандартам, подготовка кадров по данной специальности в республике, повышение их квалификации, а также внесение вклада в проведение научно-практических исследований.')}
              </p>
            </div>

            {/* Декоративный элемент снизу */}
            <div className="flex items-center justify-center gap-3 mt-12">
              <div className="w-6 h-px bg-slate-700"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-amber-500/50"></div>
              <div className="w-6 h-px bg-slate-700"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Наша деятельность */}
      <section
        ref={activitiesRef}
        className={`relative py-10 sm:py-14 md:py-16 overflow-hidden transition-all duration-700 ease-out ${
          activitiesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Фоновые декоративные элементы */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-amber-500/[0.02] rounded-full blur-3xl"></div>

        {/* Тонкий паттерн */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        {/* Угловые акценты */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-amber-600/20 hidden lg:block"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t border-r border-sky-500/20 hidden lg:block"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b border-l border-sky-500/20 hidden lg:block"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-amber-600/20 hidden lg:block"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок секции */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 sm:w-10 h-px bg-gradient-to-r from-transparent to-amber-700/40"></div>
              <span className="text-amber-800/70 text-xs font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                {t('activities.label', 'Деятельность')}
              </span>
              <div className="w-8 sm:w-10 h-px bg-gradient-to-l from-transparent to-amber-700/40"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-stone-800 mb-2 sm:mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {t('activities.title', 'Наша деятельность')}
            </h2>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 sm:w-12 h-px bg-gradient-to-r from-transparent via-stone-300 to-sky-400/30"></div>
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-amber-600/50 to-sky-500/40 rotate-45"></div>
              <div className="w-10 sm:w-12 h-px bg-gradient-to-l from-transparent via-stone-300 to-sky-400/30"></div>
            </div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xs sm:text-sm px-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <em>{t('activities.subtitle', 'Основные направления работы ассоциации')}</em>
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
            {/* Главная карточка - Повышение квалификации */}
            <div className="sm:col-span-2 lg:col-span-5 lg:row-span-2 group">
              <div className="relative h-full bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-lg sm:rounded-sm p-4 sm:p-6 overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '40px 40px'
                }}></div>

                {/* Угловые акценты */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-sky-400/30"></div>
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-sky-400/30"></div>

                <div className="relative z-10 h-full flex flex-col">
                  {/* Номер */}
                  <div className="text-5xl font-light text-sky-400/20 absolute top-0 right-3" style={{ fontFamily: 'Georgia, serif' }}>01</div>

                  {/* Иконка */}
                  <div className="w-12 h-12 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                    </svg>
                  </div>

                  <h3 className="text-xl text-white mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {t('activities.training.title', 'Повышение квалификации')}
                  </h3>

                  <div className="w-10 h-px bg-gradient-to-r from-sky-400/50 to-transparent mb-3"></div>

                  <p className="text-slate-300 text-sm leading-relaxed flex-grow" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('activities.training.desc', 'Организационно-методическая помощь по расширению и углублению знаний ревматологов')}
                  </p>

                  {/* Декоративная стрелка */}
                  <div className="mt-4 flex items-center gap-2 text-sky-400/60 group-hover:text-sky-400 transition-colors">
                    <span className="text-xs uppercase tracking-wider">Подробнее</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Карточка 2 - Организация конференций */}
            <div className="lg:col-span-4 group">
              <div className="relative h-full min-h-[140px] sm:min-h-[180px] bg-white border border-stone-200 rounded-lg sm:rounded-sm p-4 sm:p-6 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Номер */}
                <div className="absolute top-2 right-4 text-4xl font-light text-stone-200" style={{ fontFamily: 'Georgia, serif' }}>02</div>

                <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>

                <h3 className="text-lg text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('activities.conferences.title', 'Организация конференций')}
                </h3>
                <div className="w-8 h-px bg-blue-300/50 mb-3 group-hover:w-12 transition-all duration-300"></div>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {t('activities.conferences.desc', 'Проведение школ ревматологов, семинаров, симпозиумов и конгрессов')}
                </p>
              </div>
            </div>

            {/* Карточка 3 - Международное сотрудничество */}
            <div className="lg:col-span-3 group">
              <div className="relative h-full min-h-[140px] sm:min-h-[180px] bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200/50 rounded-lg sm:rounded-sm p-4 sm:p-6 hover:shadow-lg hover:shadow-sky-100/50 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Номер */}
                <div className="absolute top-2 right-3 text-3xl font-light text-sky-200" style={{ fontFamily: 'Georgia, serif' }}>03</div>

                <div className="w-10 h-10 rounded-lg bg-white border border-sky-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                  </svg>
                </div>

                <h3 className="text-base text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('activities.international.title', 'Международное сотрудничество')}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {t('activities.international.desc', 'Приглашение врачей и учёных из других стран для обмена опытом')}
                </p>
              </div>
            </div>

            {/* Карточка 4 - Научные разработки */}
            <div className="lg:col-span-3 group">
              <div className="relative h-full min-h-[140px] sm:min-h-[180px] bg-white border border-stone-200 rounded-lg sm:rounded-sm p-4 sm:p-6 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-100/50 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-amber-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-amber-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Номер */}
                <div className="absolute top-2 right-3 text-3xl font-light text-stone-200" style={{ fontFamily: 'Georgia, serif' }}>04</div>

                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" />
                  </svg>
                </div>

                <h3 className="text-base text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('activities.research.title', 'Научные разработки')}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {t('activities.research.desc', 'Разработка инновационных методов диагностики и терапии')}
                </p>
              </div>
            </div>

            {/* Карточка 5 - Издательская деятельность */}
            <div className="lg:col-span-4 group">
              <div className="relative h-full min-h-[140px] sm:min-h-[180px] bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/50 rounded-lg sm:rounded-sm p-4 sm:p-6 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-amber-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-amber-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Номер */}
                <div className="absolute top-2 right-4 text-4xl font-light text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>05</div>

                <div className="w-11 h-11 rounded-lg bg-white border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>

                <h3 className="text-lg text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('activities.publishing.title', 'Издательская деятельность')}
                </h3>
                <div className="w-8 h-px bg-amber-300/50 mb-3 group-hover:w-12 transition-all duration-300"></div>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {t('activities.publishing.desc', 'Издание учебных, научных и методических материалов')}
                </p>
              </div>
            </div>

            {/* Карточка 6 - Проведение исследований */}
            <div className="sm:col-span-2 lg:col-span-5 group">
              <div className="relative h-full min-h-[120px] sm:min-h-[140px] bg-white border border-stone-200 rounded-lg sm:rounded-sm p-4 sm:p-6 hover:border-sky-300/50 hover:shadow-lg hover:shadow-sky-100/50 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Номер */}
                <div className="absolute top-2 right-4 text-5xl font-light text-stone-100" style={{ fontFamily: 'Georgia, serif' }}>06</div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {t('activities.studies.title', 'Проведение исследований')}
                    </h3>
                    <div className="w-8 h-px bg-sky-300/50 mb-3 group-hover:w-12 transition-all duration-300"></div>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      {t('activities.studies.desc', 'Клинические, социологические и маркетинговые исследования')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка */}
          <div className="text-center mt-8">
            <Link
              to="/about/activities"
              className="group inline-flex items-center gap-3 px-6 py-3 bg-stone-800 text-white text-sm rounded-sm hover:bg-stone-700 hover:shadow-lg hover:shadow-stone-400/20 transition-all duration-300"
            >
              <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('activities.learnMore', 'Подробнее о деятельности')}
              </span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Международное сотрудничество */}
      {partners.length > 0 && (
        <section className="relative py-10 sm:py-12 md:py-16 overflow-hidden">
          {/* Градиентный фон */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

          {/* Декоративные элементы */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-sky-500/[0.05] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-[150px] sm:w-[200px] md:w-[300px] h-[150px] sm:h-[200px] md:h-[300px] bg-blue-500/[0.05] rounded-full blur-3xl"></div>
            {/* Элегантный паттерн */}
            <div className="absolute inset-0 opacity-[0.02] hidden sm:block" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          {/* Угловые акценты */}
          <div className="absolute top-6 left-6 w-16 h-16 border-t border-l border-sky-500/20 hidden lg:block"></div>
          <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-sky-500/20 hidden lg:block"></div>
          <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-blue-500/20 hidden lg:block"></div>
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r border-blue-500/20 hidden lg:block"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Заголовок секции */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-6 sm:w-10 h-px bg-gradient-to-r from-transparent to-sky-400/50"></div>
                <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rotate-45 border border-sky-400/50"></div>
                <div className="w-6 sm:w-10 h-px bg-gradient-to-l from-transparent to-sky-400/50"></div>
              </div>

              {/* Иконка глобуса */}
              <div className="w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl text-white mb-2 sm:mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('about.partners.title', 'Международное сотрудничество')}
              </h2>

              <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed px-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <em>{t('about.partners.subtitle', 'Ассоциация активно сотрудничает с ведущими международными организациями в области ревматологии')}</em>
              </p>
            </div>

            {/* Карточки партнёров */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto">
              {partners.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.website_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  {/* Карточка */}
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-sm p-4 sm:p-5 border border-slate-700/60 hover:border-sky-500/30 active:scale-[0.98] sm:active:scale-100 transition-all duration-500 text-center">
                    {/* Угловые акценты */}
                    <div className="absolute -top-px -left-px w-4 sm:w-5 h-4 sm:h-5 border-t border-l border-sky-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -bottom-px -right-px w-4 sm:w-5 h-4 sm:h-5 border-b border-r border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Лого */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4">
                      <div className="absolute inset-0 border border-slate-600/50 group-hover:border-sky-500/30 transition-colors duration-500"></div>
                      <div className="w-full h-full bg-white/95 flex items-center justify-center p-2 sm:p-2.5 group-hover:shadow-lg group-hover:shadow-sky-500/10 transition-shadow duration-500">
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.short_name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-lg sm:text-xl font-bold text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>{partner.short_name || '?'}</span>
                        )}
                      </div>
                    </div>

                    {/* Аббревиатура */}
                    <h3 className="text-base sm:text-lg text-white mb-1 sm:mb-1.5 group-hover:text-sky-300 transition-colors duration-300" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {partner.short_name || getField(partner, 'name')}
                    </h3>

                    {/* Разделитель */}
                    <div className="w-5 sm:w-6 h-px bg-slate-600 mx-auto mb-1.5 sm:mb-2 group-hover:w-8 sm:group-hover:w-10 group-hover:bg-sky-500/50 transition-all duration-300"></div>

                    {/* Полное название */}
                    <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                      {getField(partner, 'name')}
                    </p>

                    {/* Иконка ссылки - видна на мобильных */}
                    <div className="mt-2 sm:mt-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-sky-400">
                        <span>{t('common.visitWebsite', 'Перейти на сайт')}</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Декоративный элемент снизу */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="w-6 h-px bg-slate-700"></div>
              <div className="w-1 h-1 rotate-45 bg-slate-600"></div>
              <div className="w-6 h-px bg-slate-700"></div>
            </div>
          </div>
        </section>
      )}

      {/* News Preview */}
      <section
        ref={newsRef}
        className={`relative py-14 md:py-18 overflow-hidden transition-all duration-700 ease-out ${
          newsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Фоновые элементы */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/[0.02] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/[0.02] rounded-full blur-3xl"></div>

        {/* Тонкий паттерн */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        {/* Угловые акценты */}
        <div className="absolute top-6 left-6 w-14 h-14 border-t border-l border-stone-300/50 hidden lg:block"></div>
        <div className="absolute top-6 right-6 w-14 h-14 border-t border-r border-stone-300/50 hidden lg:block"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок секции */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10">
            <div className="mb-6 md:mb-0">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-700/40"></div>
                <span className="text-amber-800/70 text-xs font-medium tracking-[0.25em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('news.label', 'Новости')}
                </span>
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-700/40"></div>
              </div>
              <h2 className="text-3xl md:text-4xl text-stone-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('news.latest', 'Последние новости')}
              </h2>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-12 h-px bg-gradient-to-r from-stone-300 to-sky-400/30"></div>
                <div className="w-1.5 h-1.5 bg-amber-600/40 rotate-45"></div>
              </div>
            </div>
            <Link
              to="/news"
              className="group inline-flex items-center gap-2 px-5 py-2.5 border border-stone-300 text-stone-600 rounded-sm hover:border-sky-400/50 hover:text-sky-700 hover:bg-sky-50/30 transition-all duration-300"
            >
              <span style={{ fontFamily: 'Georgia, serif' }}>{t('news.allNews', 'Все новости')}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Сетка новостей */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white/80 rounded-sm overflow-hidden border border-stone-200 animate-pulse">
                  <div className="h-52 bg-stone-200"></div>
                  <div className="p-6">
                    <div className="h-3 bg-stone-200 rounded w-20 mb-4"></div>
                    <div className="h-5 bg-stone-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : news.length > 0 ? (
              news.map((item, index) => (
                <article key={item.id} className="group relative">
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-sm overflow-hidden border border-stone-200/80 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-500">
                    {/* Угловые акценты */}
                    <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                    <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-sky-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>

                    {/* Изображение */}
                    <div className="relative h-52 bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      {/* Градиент снизу для читаемости */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent"></div>

                      {/* Бейдж события */}
                      {item.news_type === 'event' && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 text-xs bg-amber-500/90 text-white rounded-sm uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                            {t('news.event', 'Событие')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Контент */}
                    <div className="p-6">
                      {/* Дата */}
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-stone-400">
                          {new Date(item.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Заголовок */}
                      <h3 className="text-lg text-stone-800 mb-3 line-clamp-2 group-hover:text-sky-700 transition-colors duration-300" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {getField(item, 'title')}
                      </h3>

                      {/* Разделитель */}
                      <div className="w-8 h-px bg-stone-200 mb-3 group-hover:w-12 group-hover:bg-sky-400/50 transition-all duration-300"></div>

                      {/* Превью текста */}
                      <p className="text-sm text-stone-500 mb-5 line-clamp-2 leading-relaxed">
                        {getField(item, 'excerpt') || getField(item, 'content')?.slice(0, 120) + '...'}
                      </p>

                      {/* Ссылка */}
                      <Link
                        to={`/news/${item.id}`}
                        className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 transition-colors group/link"
                      >
                        <span style={{ fontFamily: 'Georgia, serif' }}>{t('news.readMore', 'Читать далее')}</span>
                        <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-3 text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                  <em>{t('news.noNews', 'Новостей пока нет')}</em>
                </p>
              </div>
            )}
          </div>

          {/* Декоративный элемент снизу */}
          <div className="flex items-center justify-center gap-3 mt-14">
            <div className="w-8 h-px bg-stone-300"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-stone-400"></div>
            <div className="w-8 h-px bg-stone-300"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
