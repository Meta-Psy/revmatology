import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Rheumatology = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('centers');

  const tabs = [
    { id: 'centers', label: t('rheumatology.centers.title') },
    { id: 'doctors', label: t('rheumatology.doctors.title') },
    { id: 'diseases', label: t('rheumatology.diseases.title') },
    { id: 'school', label: t('rheumatology.school.rheumatologists.title') },
  ];

  const diseases = [
    { id: 'ra', name: t('rheumatology.diseases.ra'), shortName: 'РА' },
    { id: 'gout', name: t('rheumatology.diseases.gout'), shortName: 'Подагра' },
    { id: 'sle', name: t('rheumatology.diseases.sle'), shortName: 'СКВ' },
    { id: 'osteoarthritis', name: t('rheumatology.diseases.osteoarthritis'), shortName: 'ОА' },
    { id: 'as', name: t('rheumatology.diseases.as'), shortName: 'АС' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('rheumatology.title')}</h1>
          <p className="text-white/80 max-w-2xl">
            Информация о ревматологической помощи в Узбекистане: специализированные центры,
            ведущие специалисты, образовательные программы.
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Centers Tab */}
        {activeTab === 'centers' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('rheumatology.centers.title')}</h2>
            <p className="text-[var(--color-text-light)] mb-8">{t('rheumatology.centers.subtitle')}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'ТашДТУ куптармокли клиникаси', type: 'СКАЛ' },
                { name: 'ИКРБ', type: 'Республиканский центр' },
                { name: 'Ревматология-артрология булимлари', type: 'Отделение' },
              ].map((center, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <span className="text-xs font-medium text-[var(--color-primary)] bg-cyan-50 px-2 py-1 rounded">
                      {center.type}
                    </span>
                    <h3 className="font-semibold text-[var(--color-text)] mt-3 mb-2">{center.name}</h3>
                    <p className="text-sm text-[var(--color-text-light)]">
                      Ташкент, Узбекистан
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('rheumatology.doctors.title')}</h2>
            <p className="text-[var(--color-text-light)] mb-8">{t('rheumatology.doctors.subtitle')}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">ФИО Врача {i}</h3>
                      <p className="text-sm text-[var(--color-primary)]">Главный ревматолог</p>
                      <p className="text-sm text-[var(--color-text-light)] mt-1">
                        д.м.н., профессор
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diseases Tab */}
        {activeTab === 'diseases' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('rheumatology.diseases.title')}</h2>
            <p className="text-[var(--color-text-light)] mb-8">
              Информация о распространённых ревматических заболеваниях
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diseases.map((disease) => (
                <div
                  key={disease.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-[var(--color-primary)] font-bold">{disease.shortName}</span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">{disease.name}</h3>
                  <p className="text-sm text-[var(--color-text-light)]">
                    Нажмите для получения подробной информации о заболевании...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* School Tab */}
        {activeTab === 'school' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Rheumatologists School */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                {t('rheumatology.school.rheumatologists.title')}
              </h3>
              <p className="text-[var(--color-text-light)] mb-6">
                {t('rheumatology.school.rheumatologists.subtitle')}
              </p>
              <p className="text-sm text-[var(--color-text-light)] mb-6">
                Программа повышения квалификации для врачей-ревматологов. Современные методы
                диагностики и лечения ревматических заболеваний.
              </p>
              <button className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors">
                {t('rheumatology.school.rheumatologists.apply')}
              </button>
            </div>

            {/* Patients School */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                {t('rheumatology.school.patients.title')}
              </h3>
              <p className="text-[var(--color-text-light)] mb-6">
                {t('rheumatology.school.patients.subtitle')}
              </p>
              <p className="text-sm text-[var(--color-text-light)] mb-6">
                Образовательные материалы для пациентов с ревматическими заболеваниями.
                Информация о заболеваниях, лечении и образе жизни.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="flex-1 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] font-medium rounded-lg hover:bg-cyan-50 transition-colors text-center"
                >
                  {t('rheumatology.school.patients.login')}
                </Link>
                <Link
                  to="/register"
                  className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-center"
                >
                  {t('rheumatology.school.patients.register')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rheumatology;
