import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { contentAPI } from '../services/api';

const Schools = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    patronymic: '',
    phone: '',
    city: '',
    category: '',
    inn: '',
    email: '',
    specialization: '',
    workplace: '',
  });

  const categories = [
    { value: 'highest', label: { ru: 'Высшая', uz: 'Oliy', en: 'Highest' } },
    { value: 'first', label: { ru: '1-ая', uz: '1-toifa', en: '1st' } },
    { value: 'second', label: { ru: '2-ая', uz: '2-toifa', en: '2nd' } },
    { value: 'third', label: { ru: '3-я', uz: '3-toifa', en: '3rd' } },
    { value: 'none', label: { ru: 'Без категории', uz: "Toifasiz", en: 'No category' } },
  ];

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const res = await contentAPI.getNews('event', true, 0, 100);
      const allEvents = res.data || [];
      const schoolEvents = allEvents.filter(event => {
        const title = (event[`title_${lang}`] || event.title_ru || '').toLowerCase();
        return title.includes('школа') || title.includes('school') || title.includes('maktab');
      });
      setSchools(schoolEvents);
    } catch (err) {
      console.error('Error loading schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    return item[`${field}_${lang}`] || item[`${field}_ru`] || '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleOpenRegistration = (school = null) => {
    setSelectedSchool(school);
    setShowRegistration(true);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      lastName: '',
      firstName: '',
      patronymic: '',
      phone: '',
      city: '',
      category: '',
      inn: '',
      email: '',
      specialization: '',
      workplace: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      // Подготовка данных для API
      const apiData = {
        school_type: 'rheumatologist',
        event_id: selectedSchool?.id || null,
        last_name: formData.lastName,
        first_name: formData.firstName,
        patronymic: formData.patronymic || null,
        phone: formData.phone,
        city: formData.city,
        category: formData.category,
        inn: formData.inn,
        email: formData.email,
        specialization: formData.specialization,
        workplace: formData.workplace,
      };

      await contentAPI.submitSchoolApplication(apiData);

      setSubmitSuccess(true);
      resetForm();

      // Закрыть модал через 3 секунды
      setTimeout(() => {
        setShowRegistration(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setSubmitError(
        err.response?.data?.detail ||
        t('schools.submitError', 'Произошла ошибка при отправке заявки. Попробуйте позже.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 md:py-14 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-80 h-48 md:h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          {/* Паттерн ромбов */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Угловые акценты */}
        <div className="hidden sm:block absolute top-6 left-6 w-12 h-12 border-t border-l border-sky-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-12 h-12 border-t border-r border-sky-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-12 h-12 border-b border-l border-blue-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-12 h-12 border-b border-r border-blue-500/20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
            <div className="w-8 h-px bg-gradient-to-r from-sky-500/60 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-sky-400/60"></div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl text-white mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 font-light">
                  {t('schools.titleHighlight', 'Школы')}
                </span>
                {' '}
                <span className="font-normal">{t('schools.titleMain', 'Ревматологов')}</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('schools.subtitle', 'Образовательные мероприятия для врачей-ревматологов и смежных специальностей')}
              </p>
            </div>

            {/* Статистика */}
            <div className="flex gap-6 lg:gap-10">
              <div className="text-center lg:text-right">
                <div className="text-2xl md:text-3xl font-light text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>20+</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{t('schools.stat1', 'Школ проведено')}</div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-2xl md:text-3xl font-light text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>500+</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{t('schools.stat2', 'Участников')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMINENT REGISTRATION CTA */}
      <section className="relative -mt-6 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <h2 className="text-xl md:text-2xl font-medium mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('schools.ctaTitle', 'Хотите принять участие?')}
                </h2>
                <p className="text-sky-100 text-sm md:text-base">
                  {t('schools.ctaSubtitle', 'Зарегистрируйтесь на ближайшую школу ревматологов прямо сейчас')}
                </p>
              </div>
              <button
                onClick={() => handleOpenRegistration(null)}
                className="flex-shrink-0 px-6 py-3 bg-white text-sky-700 font-medium rounded-lg hover:bg-sky-50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('schools.registerNow', 'Регистрация')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* About Section */}
          <div className="relative bg-white rounded-xl shadow-sm border border-stone-100 p-6 md:p-8 mb-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-500 to-blue-600"></div>

            <div className="pl-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl text-stone-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('schools.aboutTitle', 'О школах ревматологов')}
                </h2>
              </div>

              <div className="text-stone-600 leading-relaxed space-y-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <p>
                  {t('schools.description',
                    'Школы ревматологов — это образовательные программы, направленные на повышение квалификации врачей-ревматологов и смежных специальностей. В рамках школ проводятся лекции ведущих специалистов, мастер-классы, разборы клинических случаев и практические семинары.'
                  )}
                </p>
                <p>
                  {t('schools.topics',
                    'Темы занятий охватывают современные подходы к диагностике и лечению ревматических заболеваний, использование биологических препаратов, интерпретацию лабораторных и инструментальных исследований.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10">
            <div className="group bg-white rounded-xl border border-stone-100 p-5 hover:shadow-lg hover:border-sky-200 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('schools.feature1Title', 'Практические навыки')}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {t('schools.feature1Desc', 'Мастер-классы и разборы клинических случаев с ведущими экспертами')}
              </p>
            </div>

            <div className="group bg-white rounded-xl border border-stone-100 p-5 hover:shadow-lg hover:border-sky-200 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('schools.feature2Title', 'Ведущие эксперты')}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {t('schools.feature2Desc', 'Лекции от признанных специалистов в области ревматологии')}
              </p>
            </div>

            <div className="group bg-white rounded-xl border border-stone-100 p-5 hover:shadow-lg hover:border-sky-200 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('schools.feature3Title', 'Сертификаты')}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {t('schools.feature3Desc', 'Баллы НМО и официальные сертификаты участника')}
              </p>
            </div>
          </div>

          {/* Schools List */}
          {schools.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl md:text-2xl text-stone-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('schools.upcomingTitle', 'Предстоящие и прошедшие школы')}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent"></div>
              </div>

              <div className="space-y-4">
                {schools.map((school, index) => {
                  const isPast = school.event_date_start && new Date(school.event_date_start) < new Date();
                  return (
                    <div
                      key={school.id}
                      className={`group bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-sky-200 transition-all duration-300 ${isPast ? 'opacity-80' : ''}`}
                    >
                      <div className="md:flex">
                        {school.image_url && (
                          <div className="md:w-64 lg:w-72 h-48 md:h-auto flex-shrink-0 relative overflow-hidden">
                            <img
                              src={school.image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                              <span className="text-sm font-medium text-stone-700">{String(index + 1).padStart(2, '0')}</span>
                            </div>
                          </div>
                        )}

                        <div className="p-5 md:p-6 flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              isPast
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {isPast ? t('schools.past', 'Завершено') : t('schools.upcoming', 'Предстоит')}
                            </span>
                            {school.event_date_start && (
                              <span className="text-sm text-stone-500 flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(school.event_date_start)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg md:text-xl text-stone-800 mb-2 group-hover:text-sky-700 transition-colors" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            {getLocalizedField(school, 'title')}
                          </h3>

                          {school.event_location_ru && (
                            <p className="text-stone-500 flex items-center gap-2 mb-3 text-sm">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {getLocalizedField(school, 'event_location')}
                            </p>
                          )}

                          <p className="text-stone-600 text-sm leading-relaxed line-clamp-2 mb-4">
                            {getLocalizedField(school, 'excerpt') || getLocalizedField(school, 'content')?.substring(0, 200)}
                          </p>

                          {!isPast && (
                            <button
                              onClick={() => handleOpenRegistration(school)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-sky-400 hover:to-blue-500 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              {t('schools.register', 'Регистрация')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registration Form Section - Always visible */}
          <div className="relative bg-white rounded-xl shadow-lg border border-stone-100 p-6 md:p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative">
              {/* Section Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {t('schools.registerForSchool', 'Регистрация на школу ревматологов')}
                  </h2>
                  <p className="text-stone-500">
                    {t('schools.fillFormDesc', 'Заполните форму ниже для регистрации на ближайшую школу. Все поля, отмеченные звездочкой, обязательны для заполнения.')}
                  </p>
                </div>
              </div>

              {/* Required Fields Info */}
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-sky-800">
                    <p className="font-medium mb-1">{t('schools.requiredFields', 'Необходимые данные для регистрации:')}</p>
                    <p className="text-sky-700">
                      {t('schools.requiredList', 'Фамилия, Имя, Отчество, Телефон, Город, Категория, ИНН, E-mail, Специализация, Место работы')}
                    </p>
                  </div>
                </div>
              </div>

              <RegistrationForm
                formData={formData}
                categories={categories}
                lang={lang}
                t={t}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                submitting={submitting}
                submitSuccess={submitSuccess}
                submitError={submitError}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 md:p-8 my-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl md:text-2xl text-stone-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {t('schools.registrationTitle', 'Регистрация на школу')}
                </h2>
                {selectedSchool && (
                  <p className="text-sm text-stone-500 mt-1">
                    {getLocalizedField(selectedSchool, 'title')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowRegistration(false)}
                className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-2">
                  {t('schools.successTitle', 'Заявка отправлена!')}
                </h3>
                <p className="text-stone-500">
                  {t('schools.successMessage', 'Мы свяжемся с вами в ближайшее время для подтверждения регистрации.')}
                </p>
              </div>
            ) : (
              <RegistrationForm
                formData={formData}
                categories={categories}
                lang={lang}
                t={t}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                submitting={submitting}
                submitSuccess={submitSuccess}
                submitError={submitError}
                isModal={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Registration Form component
const RegistrationForm = ({ formData, categories, lang, t, handleChange, handleSubmit, submitting, submitSuccess, submitError, isModal = false }) => (
  <form onSubmit={handleSubmit} className="space-y-5">
    {submitError && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-red-700">{submitError}</p>
      </div>
    )}

    {submitSuccess && !isModal && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="text-sm text-green-700">
          <p className="font-medium">{t('schools.successTitle', 'Заявка успешно отправлена!')}</p>
          <p>{t('schools.successMessage', 'Мы свяжемся с вами в ближайшее время для подтверждения регистрации.')}</p>
        </div>
      </div>
    )}

    {/* Row 1: ФИО */}
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.lastName', 'Фамилия')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder={lang === 'ru' ? 'Иванов' : lang === 'uz' ? 'Ivanov' : 'Ivanov'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.firstName', 'Имя')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder={lang === 'ru' ? 'Иван' : lang === 'uz' ? 'Ivan' : 'Ivan'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.patronymic', 'Отчество')}
        </label>
        <input
          type="text"
          name="patronymic"
          value={formData.patronymic}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder={lang === 'ru' ? 'Иванович' : lang === 'uz' ? 'Ivanovich' : 'Ivanovich'}
        />
      </div>
    </div>

    {/* Row 2: Телефон, Email */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.phone', 'Телефон')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          E-mail <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder="example@mail.com"
        />
      </div>
    </div>

    {/* Row 3: Город, Категория */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.city', 'Город')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder={lang === 'ru' ? 'Ташкент' : lang === 'uz' ? 'Toshkent' : 'Tashkent'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.category', 'Категория')} <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
        >
          <option value="">{t('schools.form.selectCategory', 'Выберите категорию')}</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label[lang] || cat.label.ru}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Row 4: ИНН, Специализация */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.inn', 'ИНН')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="inn"
          value={formData.inn}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder="123456789"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('schools.form.specialization', 'Специализация')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          placeholder={lang === 'ru' ? 'Ревматолог' : lang === 'uz' ? 'Revmatolog' : 'Rheumatologist'}
        />
      </div>
    </div>

    {/* Row 5: Место работы */}
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {t('schools.form.workplace', 'Место работы')} <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="workplace"
        value={formData.workplace}
        onChange={handleChange}
        required
        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
        placeholder={lang === 'ru' ? 'Название медицинского учреждения' : lang === 'uz' ? 'Tibbiyot muassasasi nomi' : 'Medical institution name'}
      />
    </div>

    <button
      type="submit"
      disabled={submitting || submitSuccess}
      className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-lg hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {submitting ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('schools.form.submitting', 'Отправка...')}
        </>
      ) : (
        <>
          {t('schools.form.submit', 'Отправить заявку')}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </button>
  </form>
);

export default Schools;
