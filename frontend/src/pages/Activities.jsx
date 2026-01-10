import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Activities = () => {
  const { t } = useTranslation();

  const activities = [
    {
      id: 'training',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
      iconBg: 'from-cyan-500 to-teal-500',
      iconLight: 'from-cyan-100 to-teal-100',
      iconColor: 'text-cyan-600',
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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      iconBg: 'from-purple-500 to-pink-500',
      iconLight: 'from-purple-100 to-pink-100',
      iconColor: 'text-purple-600',
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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
      iconBg: 'from-blue-500 to-indigo-500',
      iconLight: 'from-blue-100 to-indigo-100',
      iconColor: 'text-blue-600',
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
      id: 'research',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      iconBg: 'from-emerald-500 to-green-500',
      iconLight: 'from-emerald-100 to-green-100',
      iconColor: 'text-emerald-600',
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
    },
    {
      id: 'publishing',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      iconBg: 'from-amber-500 to-orange-500',
      iconLight: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      iconBg: 'from-rose-500 to-red-500',
      iconLight: 'from-rose-100 to-red-100',
      iconColor: 'text-rose-600',
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
    }
  ];

  const { i18n } = useTranslation();
  const lang = i18n.language;

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link to="/" className="hover:text-white transition-colors">
                {t('nav.home', 'Главная')}
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white">{t('activities.pageTitle', 'Наша деятельность')}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('activities.pageTitle', 'Наша деятельность')}
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              {t('activities.pageSubtitle', 'Ассоциация ревматологов Узбекистана ведёт активную работу по развитию ревматологической службы в стране, повышению квалификации специалистов и улучшению качества помощи пациентам.')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">6</div>
              <div className="text-slate-400 text-sm">{t('activities.stats.directions', 'Направлений работы')}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-teal-400 mb-1">50+</div>
              <div className="text-slate-400 text-sm">{t('activities.stats.events', 'Мероприятий в год')}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">10+</div>
              <div className="text-slate-400 text-sm">{t('activities.stats.partners', 'Международных партнёров')}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-1">100+</div>
              <div className="text-slate-400 text-sm">{t('activities.stats.publications', 'Публикаций')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${activity.iconLight} rounded-2xl flex items-center justify-center mb-6`}>
                    <div className={activity.iconColor}>
                      {activity.icon}
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                    {getField(activity, 'title')}
                  </h2>

                  <p className="text-lg text-slate-600 leading-relaxed mb-6">
                    {getField(activity, 'description')}
                  </p>

                  <ul className="space-y-3">
                    {getField(activity, 'details')?.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 bg-gradient-to-br ${activity.iconLight} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <svg className={`w-3 h-3 ${activity.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Card */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className={`bg-gradient-to-br ${activity.iconBg} rounded-3xl p-8 md:p-12 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                        {activity.icon}
                      </div>

                      <h3 className="text-2xl font-bold mb-4">
                        {getField(activity, 'title')}
                      </h3>

                      <p className="text-white/80 leading-relaxed">
                        {getField(activity, 'description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            {t('activities.cta.title', 'Хотите стать частью ассоциации?')}
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('activities.cta.description', 'Присоединяйтесь к нам и получите доступ к профессиональному сообществу, образовательным программам и международным связям.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
            >
              {t('activities.cta.join', 'Вступить в ассоциацию')}
            </Link>
            <Link
              to="/news"
              className="px-8 py-4 border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-800 font-medium rounded-xl transition-all duration-300"
            >
              {t('activities.cta.events', 'Ближайшие мероприятия')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Activities;
