import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Congress = () => {
  const { t } = useTranslation();
  const [showRegistration, setShowRegistration] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration submitted:', formData);
    alert('Заявка отправлена!');
    setShowRegistration(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-cyan-200 text-sm font-medium">{t('congress.upcoming')}</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            III Конгресс Ревматологов Узбекистана
          </h1>
          <div className="flex flex-wrap gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>15-17 мая 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Ташкент, Узбекистан</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Congress */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">О конгрессе</h2>
              <p className="text-[var(--color-text-light)] leading-relaxed mb-4">
                III Конгресс Ревматологов Узбекистана — крупнейшее научно-практическое мероприятие,
                объединяющее ведущих специалистов в области ревматологии из Узбекистана и зарубежных стран.
              </p>
              <p className="text-[var(--color-text-light)] leading-relaxed">
                В программе конгресса: пленарные заседания, симпозиумы, мастер-классы, постерные сессии
                и круглые столы по актуальным вопросам диагностики и лечения ревматических заболеваний.
              </p>
            </section>

            {/* Program */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('congress.program')}</h2>
              <div className="space-y-6">
                {[
                  { day: 'День 1 — 15 мая', events: ['Регистрация участников', 'Торжественное открытие', 'Пленарное заседание'] },
                  { day: 'День 2 — 16 мая', events: ['Симпозиумы', 'Мастер-классы', 'Постерная сессия'] },
                  { day: 'День 3 — 17 мая', events: ['Круглые столы', 'Закрытие конгресса', 'Культурная программа'] },
                ].map((dayProgram, i) => (
                  <div key={i} className="border-l-4 border-[var(--color-primary)] pl-4">
                    <h3 className="font-semibold text-[var(--color-text)] mb-2">{dayProgram.day}</h3>
                    <ul className="space-y-1">
                      {dayProgram.events.map((event, j) => (
                        <li key={j} className="text-sm text-[var(--color-text-light)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
                          {event}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Speakers */}
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('congress.speakers')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">Спикер {i}</h3>
                      <p className="text-sm text-[var(--color-text-light)]">д.м.н., профессор</p>
                      <p className="text-xs text-[var(--color-primary)]">Организация</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">
                {t('congress.register')}
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-light)]">Статус регистрации:</span>
                  <span className="text-green-600 font-medium">Открыта</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-light)]">До конгресса:</span>
                  <span className="font-medium">120 дней</span>
                </div>
              </div>
              <button
                onClick={() => setShowRegistration(true)}
                className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                {t('congress.register')}
              </button>
            </div>

            {/* Venue Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">
                {t('congress.location')}
              </h3>
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <p className="text-sm text-[var(--color-text-light)]">
                Конгресс-холл «Узбекистан»<br />
                г. Ташкент, ул. Амира Темура, 107
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t('congress.registrationForm.title')}</h2>
              <button onClick={() => setShowRegistration(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.fullName')} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.organization')}
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('congress.registrationForm.position')}
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                {t('congress.registrationForm.submit')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Congress;
