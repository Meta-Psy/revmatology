import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { contentAPI } from '../services/api';

const Rheumatology = ({ defaultTab = 'centers' }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ru';

  const [centers, setCenters] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerStaff, setCenterStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (defaultTab === 'centers') {
        const centersRes = await contentAPI.getCenters();
        setCenters(centersRes.data);
      } else if (defaultTab === 'chiefs') {
        const doctorsRes = await contentAPI.getChiefRheumatologists();
        setDoctors(doctorsRes.data);
      } else if (defaultTab === 'documents') {
        const docsRes = await contentAPI.getDiseases();
        setDocuments(docsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  const handleCenterSelect = async (center) => {
    if (selectedCenter?.id === center.id) {
      setSelectedCenter(null);
      setCenterStaff([]);
      return;
    }

    setSelectedCenter(center);
    setLoadingStaff(true);
    try {
      const res = await contentAPI.getCenterStaff(center.id);
      setCenterStaff(res.data);
    } catch (error) {
      console.error('Error loading staff:', error);
      setCenterStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Centers View */}
        {defaultTab === 'centers' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {lang === 'ru' ? 'Специализированные центры' : lang === 'uz' ? 'Ixtisoslashtirilgan markazlar' : 'Specialized Centers'}
              </h1>
              <p className="text-gray-600">
                {lang === 'ru'
                  ? 'Ревматологические отделения и центры Узбекистана'
                  : lang === 'uz'
                  ? "O'zbekistonning revmatologiya bo'limlari va markazlari"
                  : 'Rheumatology departments and centers of Uzbekistan'}
              </p>
            </div>

            {centers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {lang === 'ru' ? 'Центры не найдены' : lang === 'uz' ? 'Markazlar topilmadi' : 'No centers found'}
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - List of Centers */}
                <div className="lg:col-span-1 space-y-3">
                  {centers.map((center) => (
                    <button
                      key={center.id}
                      onClick={() => handleCenterSelect(center)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        selectedCenter?.id === center.id
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedCenter?.id === center.id
                            ? 'bg-white/20'
                            : 'bg-gradient-to-br from-cyan-500 to-teal-600'
                        }`}>
                          {center.image_url ? (
                            <img
                              src={`http://localhost:8000${center.image_url}`}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <svg className={`w-6 h-6 ${selectedCenter?.id === center.id ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm line-clamp-2 ${
                            selectedCenter?.id === center.id ? 'text-white' : 'text-gray-900'
                          }`}>
                            {getLocalizedField(center, 'name')}
                          </h3>
                          {getLocalizedField(center, 'address') && (
                            <p className={`text-xs line-clamp-1 mt-0.5 ${
                              selectedCenter?.id === center.id ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {getLocalizedField(center, 'address')}
                            </p>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 flex-shrink-0 transition-transform ${
                            selectedCenter?.id === center.id ? 'rotate-90 text-white' : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right Column - Center Details */}
                <div className="lg:col-span-2">
                  {!selectedCenter ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {lang === 'ru' ? 'Выберите центр' : lang === 'uz' ? 'Markazni tanlang' : 'Select a center'}
                      </h3>
                      <p className="text-gray-500">
                        {lang === 'ru'
                          ? 'Нажмите на центр слева, чтобы увидеть подробную информацию'
                          : lang === 'uz'
                          ? "Batafsil ma'lumot ko'rish uchun chapdagi markazni bosing"
                          : 'Click on a center on the left to see details'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      {/* Center Header */}
                      <div className="h-48 bg-gradient-to-br from-cyan-500 to-teal-600 relative overflow-hidden">
                        {selectedCenter.image_url ? (
                          <img
                            src={`http://localhost:8000${selectedCenter.image_url}`}
                            alt={getLocalizedField(selectedCenter, 'name')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-2xl font-bold text-white">
                            {getLocalizedField(selectedCenter, 'name')}
                          </h3>
                        </div>
                      </div>

                      {/* Center Info */}
                      <div className="p-6">
                        {getLocalizedField(selectedCenter, 'description') && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {lang === 'ru' ? 'О центре' : lang === 'uz' ? 'Markaz haqida' : 'About'}
                            </h4>
                            <p className="text-gray-600">{getLocalizedField(selectedCenter, 'description')}</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          {getLocalizedField(selectedCenter, 'address') && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {lang === 'ru' ? 'Адрес' : lang === 'uz' ? 'Manzil' : 'Address'}
                                </div>
                                <div className="text-sm text-gray-900">{getLocalizedField(selectedCenter, 'address')}</div>
                              </div>
                            </div>
                          )}
                          {selectedCenter.phone && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {lang === 'ru' ? 'Телефон' : lang === 'uz' ? 'Telefon' : 'Phone'}
                                </div>
                                <a href={`tel:${selectedCenter.phone}`} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                                  {selectedCenter.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          {selectedCenter.email && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Email</div>
                                <a href={`mailto:${selectedCenter.email}`} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                                  {selectedCenter.email}
                                </a>
                              </div>
                            </div>
                          )}
                          {selectedCenter.website && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {lang === 'ru' ? 'Сайт' : lang === 'uz' ? 'Veb-sayt' : 'Website'}
                                </div>
                                <a href={selectedCenter.website} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                                  {selectedCenter.website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Staff Section */}
                        <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {lang === 'ru' ? 'Сотрудники центра' : lang === 'uz' ? 'Markaz xodimlari' : 'Center Staff'}
                          </h4>

                          {loadingStaff ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                            </div>
                          ) : centerStaff.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {lang === 'ru' ? 'Сотрудники не добавлены' : lang === 'uz' ? "Xodimlar qo'shilmagan" : 'No staff added'}
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {centerStaff.map((staff) => (
                                <div key={staff.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex-shrink-0 overflow-hidden">
                                    {staff.photo_url ? (
                                      <img
                                        src={`http://localhost:8000${staff.photo_url}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                        {getLocalizedField(staff, 'first_name')?.charAt(0)}
                                        {getLocalizedField(staff, 'last_name')?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900 text-sm">
                                      {getLocalizedField(staff, 'last_name')} {getLocalizedField(staff, 'first_name')} {getLocalizedField(staff, 'patronymic')}
                                    </h5>
                                    {getLocalizedField(staff, 'position') && (
                                      <p className="text-xs text-cyan-600 font-medium mt-0.5">
                                        {getLocalizedField(staff, 'position')}
                                      </p>
                                    )}
                                    {getLocalizedField(staff, 'credentials') && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {getLocalizedField(staff, 'credentials')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chiefs View */}
        {defaultTab === 'chiefs' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {lang === 'ru' ? 'Главные ревматологи' : lang === 'uz' ? 'Bosh revmatologlar' : 'Chief Rheumatologists'}
              </h1>
              <p className="text-gray-600">
                {lang === 'ru'
                  ? 'Ведущие специалисты-ревматологи регионов Узбекистана'
                  : lang === 'uz'
                  ? "O'zbekiston mintaqalarining yetakchi revmatolog mutaxassislari"
                  : 'Leading rheumatology specialists of Uzbekistan regions'}
              </p>
            </div>

            {doctors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {lang === 'ru' ? 'Специалисты не найдены' : lang === 'uz' ? 'Mutaxassislar topilmadi' : 'No specialists found'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex-shrink-0 overflow-hidden">
                        {doctor.photo_url ? (
                          <img
                            src={`http://localhost:8000${doctor.photo_url}`}
                            alt={`${getLocalizedField(doctor, 'last_name')} ${getLocalizedField(doctor, 'first_name')}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                            {getLocalizedField(doctor, 'first_name')?.charAt(0)}
                            {getLocalizedField(doctor, 'last_name')?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {getLocalizedField(doctor, 'last_name')} {getLocalizedField(doctor, 'first_name')} {getLocalizedField(doctor, 'patronymic')}
                        </h3>
                        {getLocalizedField(doctor, 'position') && (
                          <p className="text-sm text-cyan-600 font-medium">
                            {getLocalizedField(doctor, 'position')}
                          </p>
                        )}
                        {getLocalizedField(doctor, 'degree') && (
                          <p className="text-sm text-gray-500 mt-1">
                            {getLocalizedField(doctor, 'degree')}
                          </p>
                        )}
                        {getLocalizedField(doctor, 'region') && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {getLocalizedField(doctor, 'region')}
                          </p>
                        )}
                      </div>
                    </div>
                    {getLocalizedField(doctor, 'workplace') && (
                      <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                        {getLocalizedField(doctor, 'workplace')}
                      </p>
                    )}
                    {(doctor.email || doctor.phone) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm">
                        {doctor.phone && (
                          <a href={`tel:${doctor.phone}`} className="text-gray-500 hover:text-cyan-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {lang === 'ru' ? 'Позвонить' : lang === 'uz' ? "Qo'ng'iroq" : 'Call'}
                          </a>
                        )}
                        {doctor.email && (
                          <a href={`mailto:${doctor.email}`} className="text-gray-500 hover:text-cyan-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {lang === 'ru' ? 'Написать' : lang === 'uz' ? 'Yozish' : 'Email'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents View (formerly Diseases) */}
        {defaultTab === 'documents' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {lang === 'ru' ? 'Нормативные документы' : lang === 'uz' ? 'Normativ hujjatlar' : 'Regulatory Documents'}
              </h1>
              <p className="text-gray-600">
                {lang === 'ru'
                  ? 'Клинические рекомендации и протоколы по ревматическим заболеваниям'
                  : lang === 'uz'
                  ? "Revmatik kasalliklar bo'yicha klinik tavsiyalar va protokollar"
                  : 'Clinical recommendations and protocols for rheumatic diseases'}
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {lang === 'ru' ? 'Документы не найдены' : lang === 'uz' ? 'Hujjatlar topilmadi' : 'No documents found'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((disease) => (
                  <div
                    key={disease.id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-cyan-500 to-teal-600">
                        {disease.short_name ? (
                          <span className="text-white font-bold text-sm">{disease.short_name}</span>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {getLocalizedField(disease, 'name')}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {getLocalizedField(disease, 'description')}
                        </p>
                      </div>
                    </div>

                    {/* Document download buttons */}
                    <div className="space-y-2">
                      {disease.recommendation_file_url && (
                        <a
                          href={`http://localhost:8000${disease.recommendation_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {lang === 'ru' ? 'Клинические рекомендации' : lang === 'uz' ? 'Klinik tavsiyalar' : 'Clinical Recommendations'}
                            </div>
                            <div className="text-xs text-blue-500">PDF</div>
                          </div>
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                      {disease.protocol_file_url && (
                        <a
                          href={`http://localhost:8000${disease.protocol_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {lang === 'ru' ? 'Клинический протокол' : lang === 'uz' ? 'Klinik protokol' : 'Clinical Protocol'}
                            </div>
                            <div className="text-xs text-emerald-500">PDF</div>
                          </div>
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Rheumatology;
