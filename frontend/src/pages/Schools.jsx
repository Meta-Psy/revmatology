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

  const handleOpenRegistration = (school) => {
    setSelectedSchool(school);
    setShowRegistration(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Здесь будет отправка на сервер
    console.log('Registration submitted:', {
      school: selectedSchool?.id,
      ...formData
    });

    // Имитация отправки
    setTimeout(() => {
      setSubmitting(false);
      setShowRegistration(false);
      alert(t('schools.registrationSuccess', 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'));
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
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('schools.title', 'Школы ревматологов')}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            {t('schools.subtitle', 'Образовательные мероприятия для врачей-ревматологов')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('schools.aboutTitle', 'О школах ревматологов')}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                {t('schools.description',
                  'Школы ревматологов - это образовательные программы, направленные на повышение квалификации врачей-ревматологов и смежных специальностей. ' +
                  'В рамках школ проводятся лекции ведущих специалистов, мастер-классы, разборы клинических случаев и практические семинары.'
                )}
              </p>
              <p className="mt-4">
                {t('schools.topics',
                  'Темы занятий охватывают современные подходы к диагностике и лечению ревматических заболеваний, ' +
                  'использование биологических препаратов, интерпретацию лабораторных и инструментальных исследований.'
                )}
              </p>
            </div>
          </div>

          {/* Schools List */}
          {schools.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                {t('schools.upcomingTitle', 'Предстоящие и прошедшие школы')}
              </h2>
              <div className="grid gap-6">
                {schools.map((school) => {
                  const isPast = school.event_date_start && new Date(school.event_date_start) < new Date();
                  return (
                    <div
                      key={school.id}
                      className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isPast ? 'opacity-75' : ''}`}
                    >
                      <div className="md:flex">
                        {school.image_url && (
                          <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                            <img
                              src={school.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6 flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              isPast
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {isPast ? t('schools.past', 'Завершено') : t('schools.upcoming', 'Предстоит')}
                            </span>
                            {school.event_date_start && (
                              <span className="text-sm text-gray-500">
                                {formatDate(school.event_date_start)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {getLocalizedField(school, 'title')}
                          </h3>
                          {school.event_location_ru && (
                            <p className="text-gray-500 flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {getLocalizedField(school, 'event_location')}
                            </p>
                          )}
                          <p className="text-gray-600 line-clamp-3">
                            {getLocalizedField(school, 'excerpt') || getLocalizedField(school, 'content')?.substring(0, 200)}
                          </p>
                          {!isPast && (
                            <button
                              onClick={() => handleOpenRegistration(school)}
                              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                            >
                              {t('schools.register', 'Регистрация')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
          ) : (
            /* No schools - show registration form anyway */
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('schools.registerForSchool', 'Регистрация на школу ревматологов')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('schools.fillForm', 'Заполните форму для регистрации на ближайшую школу ревматологов')}
              </p>
              <RegistrationForm
                formData={formData}
                categories={categories}
                lang={lang}
                t={t}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t('schools.feature1Title', 'Практические навыки')}
              </h3>
              <p className="text-white/80 text-sm">
                {t('schools.feature1Desc', 'Мастер-классы и разборы клинических случаев')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t('schools.feature2Title', 'Ведущие эксперты')}
              </h3>
              <p className="text-white/80 text-sm">
                {t('schools.feature2Desc', 'Лекции от признанных специалистов в области ревматологии')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t('schools.feature3Title', 'Сертификаты')}
              </h3>
              <p className="text-white/80 text-sm">
                {t('schools.feature3Desc', 'Баллы НМО и сертификаты участника')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t('schools.registrationTitle', 'Регистрация на школу')}
                </h2>
                {selectedSchool && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getLocalizedField(selectedSchool, 'title')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowRegistration(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <RegistrationForm
              formData={formData}
              categories={categories}
              lang={lang}
              t={t}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Separate Registration Form component
const RegistrationForm = ({ formData, categories, lang, t, handleChange, handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Row 1: Фамилия, Имя, Отчество */}
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.lastName', 'Фамилия')} *
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder={lang === 'ru' ? 'Иванов' : lang === 'uz' ? 'Ivanov' : 'Ivanov'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.firstName', 'Имя')} *
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder={lang === 'ru' ? 'Иван' : lang === 'uz' ? 'Ivan' : 'Ivan'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.patronymic', 'Отчество')}
        </label>
        <input
          type="text"
          name="patronymic"
          value={formData.patronymic}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder={lang === 'ru' ? 'Иванович' : lang === 'uz' ? 'Ivanovich' : 'Ivanovich'}
        />
      </div>
    </div>

    {/* Row 2: Телефон, Email */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.phone', 'Телефон')} *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="example@mail.com"
        />
      </div>
    </div>

    {/* Row 3: Город, Категория */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.city', 'Город')} *
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder={lang === 'ru' ? 'Ташкент' : lang === 'uz' ? 'Toshkent' : 'Tashkent'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.category', 'Категория')} *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.inn', 'ИНН')} *
        </label>
        <input
          type="text"
          name="inn"
          value={formData.inn}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="123456789"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('schools.form.specialization', 'Специализация')} *
        </label>
        <input
          type="text"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder={lang === 'ru' ? 'Ревматолог' : lang === 'uz' ? 'Revmatolog' : 'Rheumatologist'}
        />
      </div>
    </div>

    {/* Row 5: Место работы */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('schools.form.workplace', 'Место работы')} *
      </label>
      <input
        type="text"
        name="workplace"
        value={formData.workplace}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        placeholder={lang === 'ru' ? 'Название медицинского учреждения' : lang === 'uz' ? 'Tibbiyot muassasasi nomi' : 'Medical institution name'}
      />
    </div>

    <button
      type="submit"
      disabled={submitting}
      className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting
        ? t('schools.form.submitting', 'Отправка...')
        : t('schools.form.submit', 'Отправить заявку')
      }
    </button>
  </form>
);

export default Schools;
