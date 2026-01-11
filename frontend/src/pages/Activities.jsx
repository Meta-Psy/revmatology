import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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

const Activities = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Refs для анимаций секций
  const [introRef, introInView] = useInView();
  const [activitiesRef, activitiesInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const activities = [
    {
      id: 'training',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
      color: 'sky',
      title_ru: 'Повышение квалификации',
      title_uz: 'Malaka oshirish',
      title_en: 'Professional Development',
      description_ru: 'Оказание организационно-методической и практической помощи по повышению квалификации, расширению и углублению специальных знаний ревматологов.',
      description_uz: "Revmatologlarning maxsus bilimlarini kengaytirish va chuqurlashtirish, malaka oshirish bo'yicha tashkiliy-uslubiy va amaliy yordam ko'rsatish.",
      description_en: 'Providing organizational, methodological and practical assistance in professional development, expanding and deepening the specialized knowledge of rheumatologists.',
      details_ru: [
        'Организация курсов повышения квалификации для врачей-ревматологов',
        'Проведение мастер-классов с участием ведущих специалистов',
        'Обучение современным методам диагностики и лечения',
        'Сертификационные программы по ревматологии'
      ],
      details_uz: [
        "Revmatolog shifokorlar uchun malaka oshirish kurslarini tashkil etish",
        "Yetakchi mutaxassislar ishtirokida master-klasslar o'tkazish",
        "Zamonaviy diagnostika va davolash usullariga o'qitish",
        "Revmatologiya bo'yicha sertifikatlash dasturlari"
      ],
      details_en: [
        'Organization of advanced training courses for rheumatologists',
        'Conducting master classes with leading specialists',
        'Training in modern diagnostic and treatment methods',
        'Certification programs in rheumatology'
      ]
    },
    {
      id: 'conferences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      color: 'blue',
      title_ru: 'Организация конференций',
      title_uz: 'Konferensiyalar tashkil etish',
      title_en: 'Organizing Conferences',
      description_ru: 'Проведение экспертных советов, школ ревматологов, школ пациентов, семинаров, тренингов, научно-практических конференций, симпозиумов, конгрессов.',
      description_uz: "Ekspert kengashlari, revmatologlar maktablari, bemorlar maktablari, seminarlar, treninglar, ilmiy-amaliy konferensiyalar, simpoziumlar, kongresslar o'tkazish.",
      description_en: 'Conducting expert councils, schools for rheumatologists, patient schools, seminars, trainings, scientific and practical conferences, symposiums, congresses.',
      details_ru: [
        'Ежегодные конгрессы ревматологов Узбекистана',
        'Школы ревматологов для практикующих врачей',
        'Школы пациентов для больных ревматическими заболеваниями',
        'Экспертные советы по актуальным проблемам ревматологии',
        'Научно-практические семинары и тренинги'
      ],
      details_uz: [
        "O'zbekiston revmatologlarining yillik kongresslari",
        "Amaliyotchi shifokorlar uchun revmatologlar maktablari",
        "Revmatik kasalliklar bilan og'rigan bemorlar uchun maktablar",
        "Revmatologiyaning dolzarb muammolari bo'yicha ekspert kengashlari",
        "Ilmiy-amaliy seminarlar va treninglar"
      ],
      details_en: [
        'Annual congresses of rheumatologists of Uzbekistan',
        'Schools for practicing physicians',
        'Patient schools for those with rheumatic diseases',
        'Expert councils on current problems of rheumatology',
        'Scientific and practical seminars and trainings'
      ]
    },
    {
      id: 'international',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
      color: 'amber',
      title_ru: 'Международное сотрудничество',
      title_uz: 'Xalqaro hamkorlik',
      title_en: 'International Cooperation',
      description_ru: 'Сотрудничество со своими коллегами-ревматологами из-за рубежа. Приглашение для обмена знаниями и опытом в области ревматологии врачей, ученых из других стран.',
      description_uz: "Xorijdagi hamkasb revmatologlar bilan hamkorlik. Revmatologiya sohasida bilim va tajriba almashish uchun boshqa mamlakatlardan shifokorlar, olimlarni taklif qilish.",
      description_en: 'Cooperation with fellow rheumatologists from abroad. Inviting doctors and scientists from other countries for knowledge and experience exchange in rheumatology.',
      details_ru: [
        'Партнёрство с EULAR (Европейская антиревматическая лига)',
        'Сотрудничество с APLAR (Азиатско-Тихоокеанская лига)',
        'Обмен опытом с российскими коллегами',
        'Приглашение зарубежных лекторов на конференции',
        'Стажировки для узбекских врачей за рубежом'
      ],
      details_uz: [
        "EULAR (Yevropa antirevmatik ligasi) bilan hamkorlik",
        "APLAR (Osiyo-Tinch okeani ligasi) bilan hamkorlik",
        "Rossiyalik hamkasblar bilan tajriba almashish",
        "Konferensiyalarga xorijlik ma'ruzachilarni taklif qilish",
        "O'zbekistonlik shifokorlarning xorijda stajirovkasi"
      ],
      details_en: [
        'Partnership with EULAR (European League Against Rheumatism)',
        'Cooperation with APLAR (Asia Pacific League)',
        'Experience exchange with Russian colleagues',
        'Inviting foreign lecturers to conferences',
        'Internships for Uzbek doctors abroad'
      ]
    },
    {
      id: 'publishing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: 'orange',
      title_ru: 'Издательская деятельность',
      title_uz: 'Nashriyot faoliyati',
      title_en: 'Publishing Activities',
      description_ru: 'Разработка и издание учебных, научных, методических, информационных материалов для врачей-ревматологов.',
      description_uz: "Revmatolog shifokorlar uchun o'quv, ilmiy, uslubiy, axborot materiallarini ishlab chiqish va nashr etish.",
      description_en: 'Development and publication of educational, scientific, methodological, informational materials for rheumatologists.',
      details_ru: [
        'Издание учебников и учебных пособий по ревматологии',
        'Публикация клинических рекомендаций и протоколов',
        'Выпуск информационных бюллетеней для врачей',
        'Разработка памяток и брошюр для пациентов',
        'Публикация научных статей в медицинских журналах'
      ],
      details_uz: [
        "Revmatologiya bo'yicha darsliklar va o'quv qo'llanmalarini nashr etish",
        "Klinik tavsiyalar va protokollarni nashr etish",
        "Shifokorlar uchun axborot byulletenlari chiqarish",
        "Bemorlar uchun eslatmalar va broshyuralar ishlab chiqish",
        "Tibbiy jurnallarda ilmiy maqolalarni nashr etish"
      ],
      details_en: [
        'Publication of textbooks and manuals on rheumatology',
        'Publication of clinical guidelines and protocols',
        'Release of newsletters for physicians',
        'Development of leaflets and brochures for patients',
        'Publication of scientific articles in medical journals'
      ]
    },
    {
      id: 'studies',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      color: 'rose',
      title_ru: 'Проведение исследований',
      title_uz: 'Tadqiqotlar olib borish',
      title_en: 'Conducting Research',
      description_ru: 'Проведение клинических, социологических, маркетинговых и иных исследований в области ревматологии.',
      description_uz: "Revmatologiya sohasida klinik, sotsiologik, marketing va boshqa tadqiqotlarni o'tkazish.",
      description_en: 'Conducting clinical, sociological, marketing and other research in the field of rheumatology.',
      details_ru: [
        'Клинические испытания новых препаратов',
        'Эпидемиологические исследования распространённости',
        'Изучение качества жизни пациентов',
        'Анализ экономической эффективности терапии',
        'Социологические опросы среди врачей и пациентов'
      ],
      details_uz: [
        "Yangi dori vositalarining klinik sinovlari",
        "Tarqalganlik bo'yicha epidemiologik tadqiqotlar",
        "Bemorlar hayot sifatini o'rganish",
        "Terapiyaning iqtisodiy samaradorligini tahlil qilish",
        "Shifokorlar va bemorlar orasida sotsiologik so'rovlar"
      ],
      details_en: [
        'Clinical trials of new drugs',
        'Epidemiological prevalence studies',
        'Patient quality of life research',
        'Analysis of therapy cost-effectiveness',
        'Sociological surveys among doctors and patients'
      ]
    },
    {
      id: 'research',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      color: 'emerald',
      title_ru: 'Научные разработки',
      title_uz: 'Ilmiy ishlanmalar',
      title_en: 'Scientific Research',
      description_ru: 'Разработка инновационных методов диагностики и терапии для точной постановки диагноза и эффективного лечения ревматологических болезней.',
      description_uz: "Revmatologik kasalliklarni aniq tashxislash va samarali davolash uchun diagnostika va terapiyaning innovatsion usullarini ishlab chiqish.",
      description_en: 'Development of innovative diagnostic and therapeutic methods for accurate diagnosis and effective treatment of rheumatological diseases.',
      details_ru: [
        'Исследование новых биомаркеров ревматических заболеваний',
        'Разработка протоколов ранней диагностики',
        'Внедрение современных методов визуализации',
        'Изучение эффективности биологической терапии',
        'Разработка национальных клинических рекомендаций'
      ],
      details_uz: [
        "Revmatik kasalliklarning yangi biomarkerlarini tadqiq qilish",
        "Erta tashxislash protokollarini ishlab chiqish",
        "Zamonaviy vizualizatsiya usullarini joriy etish",
        "Biologik terapiya samaradorligini o'rganish",
        "Milliy klinik tavsiyalarni ishlab chiqish"
      ],
      details_en: [
        'Research on new biomarkers of rheumatic diseases',
        'Development of early diagnosis protocols',
        'Implementation of modern imaging methods',
        'Study of biological therapy effectiveness',
        'Development of national clinical guidelines'
      ]
    }
  ];

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const colorClasses = {
    sky: {
      iconBg: 'bg-sky-500/20',
      iconBorder: 'border-sky-400/30',
      iconText: 'text-sky-400',
      lightBg: 'bg-sky-50',
      lightBorder: 'border-sky-200',
      lightText: 'text-sky-600',
      checkBg: 'bg-sky-100',
      checkText: 'text-sky-600',
      accent: 'from-sky-400/50'
    },
    blue: {
      iconBg: 'bg-blue-500/20',
      iconBorder: 'border-blue-400/30',
      iconText: 'text-blue-400',
      lightBg: 'bg-blue-50',
      lightBorder: 'border-blue-200',
      lightText: 'text-blue-600',
      checkBg: 'bg-blue-100',
      checkText: 'text-blue-600',
      accent: 'from-blue-400/50'
    },
    amber: {
      iconBg: 'bg-amber-500/20',
      iconBorder: 'border-amber-400/30',
      iconText: 'text-amber-400',
      lightBg: 'bg-amber-50',
      lightBorder: 'border-amber-200',
      lightText: 'text-amber-600',
      checkBg: 'bg-amber-100',
      checkText: 'text-amber-600',
      accent: 'from-amber-400/50'
    },
    emerald: {
      iconBg: 'bg-emerald-500/20',
      iconBorder: 'border-emerald-400/30',
      iconText: 'text-emerald-400',
      lightBg: 'bg-emerald-50',
      lightBorder: 'border-emerald-200',
      lightText: 'text-emerald-600',
      checkBg: 'bg-emerald-100',
      checkText: 'text-emerald-600',
      accent: 'from-emerald-400/50'
    },
    orange: {
      iconBg: 'bg-orange-500/20',
      iconBorder: 'border-orange-400/30',
      iconText: 'text-orange-400',
      lightBg: 'bg-orange-50',
      lightBorder: 'border-orange-200',
      lightText: 'text-orange-600',
      checkBg: 'bg-orange-100',
      checkText: 'text-orange-600',
      accent: 'from-orange-400/50'
    },
    rose: {
      iconBg: 'bg-rose-500/20',
      iconBorder: 'border-rose-400/30',
      iconText: 'text-rose-400',
      lightBg: 'bg-rose-50',
      lightBorder: 'border-rose-200',
      lightText: 'text-rose-600',
      checkBg: 'bg-rose-100',
      checkText: 'text-rose-600',
      accent: 'from-rose-400/50'
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-80 h-48 md:h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          {/* Элегантный паттерн - ромбы */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Угловые акценты */}
        <div className="hidden sm:block absolute top-8 left-8 w-12 md:w-16 h-12 md:h-16 border-t border-l border-sky-500/20"></div>
        <div className="hidden sm:block absolute top-8 right-8 w-12 md:w-16 h-12 md:h-16 border-t border-r border-sky-500/20"></div>
        <div className="hidden sm:block absolute bottom-8 left-8 w-12 md:w-16 h-12 md:h-16 border-b border-l border-blue-500/20"></div>
        <div className="hidden sm:block absolute bottom-8 right-8 w-12 md:w-16 h-12 md:h-16 border-b border-r border-blue-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Левая часть - текст */}
            <div className="text-center lg:text-left">
              {/* Навигационная цепочка */}
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 justify-center lg:justify-start">
                <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('nav.home', 'Главная')}
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>{t('activities.pageTitle', 'Наша деятельность')}</span>
              </nav>

              {/* Декоративный элемент над заголовком */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
                <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-sky-500/60 to-transparent"></div>
                <div className="w-1.5 h-1.5 rotate-45 bg-sky-400/60"></div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 font-light">
                  {t('activities.titleHighlight', 'Наша')}
                </span>
                <br />
                <span className="font-normal">{t('activities.titleMain', 'Деятельность')}</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('activities.pageSubtitle', 'Ассоциация ревматологов Узбекистана ведёт активную работу по развитию ревматологической службы в стране')}
              </p>

              {/* Статистика - элегантная строка */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 sm:gap-10">
                {[
                  { number: '6', label: t('activities.stats.directions', 'направлений') },
                  { number: '50+', label: t('activities.stats.events', 'мероприятий') },
                  { number: '10+', label: t('activities.stats.partners', 'партнёров') }
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-3xl sm:text-4xl font-light text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                      {stat.number}
                    </div>
                    <div className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая часть - вертикальный список направлений */}
            <div className="hidden lg:block relative">
              {/* Фоновая большая цифра */}
              <div className="absolute -top-8 -right-4 text-[180px] font-light text-slate-800/40 select-none leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                6
              </div>

              {/* Вертикальная линия */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>

              {/* Список направлений */}
              <div className="relative space-y-1">
                {[
                  { num: '01', title: t('activities.hero.item1', 'Повышение квалификации'), color: 'sky' },
                  { num: '02', title: t('activities.hero.item2', 'Организация конференций'), color: 'blue' },
                  { num: '03', title: t('activities.hero.item3', 'Международное сотрудничество'), color: 'amber' },
                  { num: '04', title: t('activities.hero.item4', 'Издательская деятельность'), color: 'orange' },
                  { num: '05', title: t('activities.hero.item5', 'Проведение исследований'), color: 'rose' },
                  { num: '06', title: t('activities.hero.item6', 'Научные разработки'), color: 'emerald' }
                ].map((item, i) => (
                  <div key={i} className="group flex items-center gap-4 py-3 pl-2 cursor-default">
                    {/* Точка на линии */}
                    <div className={`relative z-10 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      item.color === 'sky' ? 'border-sky-500/60 group-hover:bg-sky-500 group-hover:border-sky-400' :
                      item.color === 'blue' ? 'border-blue-500/60 group-hover:bg-blue-500 group-hover:border-blue-400' :
                      item.color === 'amber' ? 'border-amber-500/60 group-hover:bg-amber-500 group-hover:border-amber-400' :
                      item.color === 'orange' ? 'border-orange-500/60 group-hover:bg-orange-500 group-hover:border-orange-400' :
                      item.color === 'rose' ? 'border-rose-500/60 group-hover:bg-rose-500 group-hover:border-rose-400' :
                      'border-emerald-500/60 group-hover:bg-emerald-500 group-hover:border-emerald-400'
                    } bg-slate-900`}></div>

                    {/* Номер */}
                    <span className={`text-xs font-medium tracking-wider transition-colors duration-300 ${
                      item.color === 'sky' ? 'text-slate-600 group-hover:text-sky-400' :
                      item.color === 'blue' ? 'text-slate-600 group-hover:text-blue-400' :
                      item.color === 'amber' ? 'text-slate-600 group-hover:text-amber-400' :
                      item.color === 'orange' ? 'text-slate-600 group-hover:text-orange-400' :
                      item.color === 'rose' ? 'text-slate-600 group-hover:text-rose-400' :
                      'text-slate-600 group-hover:text-emerald-400'
                    }`} style={{ fontFamily: 'Georgia, serif' }}>
                      {item.num}
                    </span>

                    {/* Название */}
                    <span className="text-slate-400 group-hover:text-white transition-colors duration-300 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                      {item.title}
                    </span>

                    {/* Стрелка при hover */}
                    <svg className={`w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 ${
                      item.color === 'sky' ? 'text-sky-400' :
                      item.color === 'blue' ? 'text-blue-400' :
                      item.color === 'amber' ? 'text-amber-400' :
                      item.color === 'orange' ? 'text-orange-400' :
                      item.color === 'rose' ? 'text-rose-400' :
                      'text-emerald-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Декоративный элемент внизу */}
              <div className="mt-6 pl-12 flex items-center gap-2">
                <div className="w-8 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                <span className="text-slate-600 text-xs uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('activities.hero.scroll', 'Подробнее ниже')}
                </span>
                <svg className="w-4 h-4 text-slate-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Введение - компактная полоса */}
      <section
        ref={introRef}
        className={`relative py-10 sm:py-12 overflow-hidden transition-all duration-700 ease-out ${
          introInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Фоновый градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-white to-stone-50"></div>

        {/* Декоративные элементы */}
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-sky-500/[0.02] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-amber-500/[0.02] rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Иконка слева */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-stone-100 border border-stone-200 flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                {/* Угловой акцент */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-amber-400/40"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-amber-400/40"></div>
              </div>
            </div>

            {/* Текст */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-stone-600 text-base sm:text-lg leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span className="text-stone-800 font-medium">{t('activities.intro.highlight', 'Комплексная деятельность')}</span>
                {' '}{t('activities.intro.text', ', направленная на повышение качества ревматологической помощи населению, развитие научных исследований и укрепление международного сотрудничества.')}
              </p>
            </div>

            {/* Декоративный разделитель справа - только на десктопе */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-stone-300 to-transparent"></div>
              <div className="text-stone-400 text-xs uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif', writingMode: 'vertical-rl' }}>
                {t('activities.intro.label', 'Миссия')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Основные направления деятельности */}
      <section
        ref={activitiesRef}
        className={`relative py-10 sm:py-14 md:py-20 overflow-hidden transition-all duration-700 ease-out ${
          activitiesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Фоновые декоративные элементы */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>

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
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 sm:w-10 h-px bg-gradient-to-r from-transparent to-amber-700/40"></div>
              <span className="text-amber-800/70 text-xs font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                {t('activities.section.label', 'Направления')}
              </span>
              <div className="w-8 sm:w-10 h-px bg-gradient-to-l from-transparent to-amber-700/40"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-stone-800 mb-2 sm:mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {t('activities.section.title', 'Основные направления работы')}
            </h2>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 sm:w-12 h-px bg-gradient-to-r from-transparent via-stone-300 to-sky-400/30"></div>
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-amber-600/50 to-sky-500/40 rotate-45"></div>
              <div className="w-10 sm:w-12 h-px bg-gradient-to-l from-transparent via-stone-300 to-sky-400/30"></div>
            </div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xs sm:text-sm px-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <em>{t('activities.section.subtitle', 'Шесть ключевых направлений, определяющих нашу миссию')}</em>
            </p>
          </div>

          {/* Карточки направлений */}
          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {activities.map((activity, index) => {
              const isEven = index % 2 === 0;
              const colors = colorClasses[activity.color];

              return (
                <article key={activity.id} className="relative">
                  {/* Номер - фоновый */}
                  <div
                    className={`absolute -top-6 sm:-top-8 ${isEven ? 'left-0' : 'right-0'} text-[80px] sm:text-[100px] md:text-[140px] font-light text-stone-100 select-none -z-10 leading-none`}
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 lg:gap-10 items-center`}>
                    {/* Визуальный акцент - компактный */}
                    <div className="w-full sm:w-auto flex-shrink-0">
                      <div className="relative group">
                        {/* Компактная карточка с иконкой */}
                        <div className="relative w-full sm:w-48 md:w-56 aspect-square bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
                          {/* Декоративные элементы */}
                          <div className={`absolute top-0 right-0 w-32 h-32 ${colors.iconBg} rounded-full blur-2xl`}></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-700/30 rounded-full blur-2xl"></div>
                          <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
                            backgroundSize: '40px 40px'
                          }}></div>

                          {/* Угловые акценты */}
                          <div className={`absolute top-3 left-3 w-5 h-5 border-t border-l ${colors.iconBorder}`}></div>
                          <div className={`absolute bottom-3 right-3 w-5 h-5 border-b border-r ${colors.iconBorder}`}></div>

                          {/* Центрированный контент */}
                          <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                            {/* Большая иконка */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                              <div className={`${colors.iconText} scale-125 md:scale-150`}>
                                {activity.icon}
                              </div>
                            </div>

                            {/* Мини-лейбл */}
                            <div className={`text-xs uppercase tracking-widest ${colors.iconText} text-center opacity-80`} style={{ fontFamily: 'Georgia, serif' }}>
                              {t('activities.direction', 'Направление')} {String(index + 1).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Основной контент */}
                    <div className="flex-1 min-w-0">
                      {/* Заголовок */}
                      <h3 className="text-xl sm:text-2xl md:text-3xl text-stone-800 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {getField(activity, 'title')}
                      </h3>

                      {/* Разделитель */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-12 h-px bg-gradient-to-r ${colors.accent} to-stone-200`}></div>
                        <div className={`w-1.5 h-1.5 ${colors.lightBg} rotate-45`}></div>
                      </div>

                      {/* Описание */}
                      <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {getField(activity, 'description')}
                      </p>

                      {/* Детали - горизонтальный grid на десктопе */}
                      <div className="relative">
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${colors.accent} via-stone-200 to-transparent`}></div>

                        <div className="pl-4 sm:pl-5">
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                            {getField(activity, 'details')?.map((detail, i) => (
                              <li key={i} className="flex items-start gap-2.5 group/item">
                                <div className={`w-4 h-4 ${colors.checkBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform`}>
                                  <svg className={`w-2.5 h-2.5 ${colors.checkText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-stone-600 text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                                  {detail}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className={`relative py-16 md:py-20 overflow-hidden transition-all duration-700 ease-out ${
          ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Декоративный элемент сверху */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
            <div className="w-2 h-2 rotate-45 border border-amber-400/50"></div>
            <div className="w-10 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
          </div>

          {/* Иконка */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl text-white mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('activities.cta.title', 'Хотите стать частью ассоциации?')}
          </h2>

          <p className="text-sky-400/80 text-sm uppercase tracking-[0.2em] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {t('activities.cta.subtitle', 'Присоединяйтесь к профессиональному сообществу')}
          </p>

          {/* Тонкий разделитель */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('activities.cta.description', 'Получите доступ к образовательным программам, международным связям и профессиональному сообществу ведущих специалистов в области ревматологии.')}
          </p>

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {t('activities.cta.join', 'Вступить в ассоциацию')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/news"
              className="group px-6 sm:px-8 py-3.5 sm:py-4 border border-slate-600/80 text-slate-300 hover:border-sky-500/50 hover:text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {t('activities.cta.events', 'Ближайшие мероприятия')}
              <svg className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Декоративный элемент снизу */}
          <div className="flex items-center justify-center gap-3 mt-10">
            <div className="w-6 h-px bg-slate-700"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-amber-500/50"></div>
            <div className="w-6 h-px bg-slate-700"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Activities;
