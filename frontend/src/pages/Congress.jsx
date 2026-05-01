import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { contentAPI, getImageUrl } from '../services/api';
import { useHeroImage } from '../hooks/useHeroImage';

const Congress = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { id } = useParams();
  const heroImage = useHeroImage('congress');

  const [congresses, setCongresses] = useState([]);
  const [congress, setCongress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('main');
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showInfoLetter, setShowInfoLetter] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [formData, setFormData] = useState({
    last_name: '', first_name: '', patronymic: '',
    email: '', phone: '', organization: '', position: '',
    academic_degree: '', academic_title: '', institution_address: '',
    participation_form: 'participation', report_title: '',
    is_young_scientist: false, needs_hotel: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadCongresses(); }, []);

  useEffect(() => {
    if (id) {
      loadCongressDetail(parseInt(id));
    } else if (congresses.length > 0) {
      const upcoming = congresses.filter(c => c.date_start && new Date(c.date_start) >= new Date());
      if (upcoming.length === 1) {
        setCongress(null);
        navigate(`/congress/${upcoming[0].id}`);
      } else if (upcoming.length === 0 && congresses.length === 1) {
        setCongress(null);
        navigate(`/congress/${congresses[0].id}`);
      }
    }
  }, [id, congresses]);

  const loadCongresses = async () => {
    try {
      const res = await contentAPI.getCongresses();
      setCongresses(res.data || []);
    } catch (err) {
      console.error('Error loading congresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCongressDetail = async (congressId) => {
    try {
      setLoading(true);
      const res = await contentAPI.getCongressDetail(congressId);
      setCongress(res.data);
      if (res.data.program_days?.length > 0) {
        setSelectedDayId(res.data.program_days[0].id);
        if (res.data.program_days[0].sections?.length > 0) {
          setSelectedSectionId(res.data.program_days[0].sections[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading congress detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const L = (item, field) => item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  const Lf = (field) => congress?.[`${field}_${lang}`] || congress?.[`${field}_ru`] || '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US';
    if (end && start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    } else if (end) {
      return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return start.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!congress) return;
    setSubmitting(true);
    try {
      const res = await contentAPI.registerForCongress(congress.id, { ...formData, congress_id: congress.id });
      setShowRegistration(false);
      setRegistrationSuccess({ id: res.data?.id });
      setFormData({ last_name: '', first_name: '', patronymic: '', email: '', phone: '', organization: '', position: '', academic_degree: '', academic_title: '', institution_address: '', participation_form: 'participation', report_title: '', is_young_scientist: false, needs_hotel: false });
    } catch (err) {
      alert(t('congress.registrationError', 'Ошибка при отправке заявки'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const tabs = [
    { key: 'main', label: t('congress.tabs.main', 'Главная') },
    { key: 'about', label: t('congress.tabs.about', 'О конгрессе') },
    { key: 'organizers', label: t('congress.tabs.organizers', 'Организаторы') },
    { key: 'program', label: t('congress.tabs.program', 'Программа') },
    { key: 'speakers', label: t('congress.tabs.speakers', 'Спикеры') },
    { key: 'youngScientists', label: t('congress.tabs.youngScientists', 'Конкурс молодых ученых') },
  ];

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400" style={{ fontFamily: 'Georgia, serif' }}>{t('common.loading', 'Загрузка...')}</p>
        </div>
      </div>
    );
  }

  // ==================== CONGRESS LIST ====================
  if (!congress && !id) {
    const upcomingCongresses = congresses.filter(c => c.date_start && new Date(c.date_start) >= new Date());
    const pastCongresses = congresses.filter(c => !c.date_start || new Date(c.date_start) < new Date());

    return (
      <div>
        <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
            </div>
          )}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('nav.home', 'Главная')}</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.title', 'Конгрессы')}</span>
            </nav>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                {lang === 'ru' ? 'Научные' : lang === 'uz' ? 'Ilmiy' : 'Scientific'}
              </span>{' '}
              <span className="font-normal">{lang === 'ru' ? 'Конгрессы' : lang === 'uz' ? 'Kongresslar' : 'Congresses'}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Georgia, serif' }}>
              {t('congress.subtitle', 'Научно-практические мероприятия Ассоциации ревматологов Узбекистана')}
            </p>
          </div>
        </section>

        <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {upcomingCongresses.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.upcoming', 'Предстоящие конгрессы')}</h2>
                </div>
                <div className="space-y-6">
                  {upcomingCongresses.map((c, index) => (
                    <Link key={c.id} to={`/congress/${c.id}`} className="group block w-full text-left bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden hover:shadow-xl hover:border-cyan-200 transition-all duration-300">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative md:w-80 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                          {c.image_url ? (
                            <img src={getImageUrl(c.image_url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full min-h-[12rem] bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-sm font-medium text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>{String(index + 1).padStart(2, '0')}</span>
                          </div>
                        </div>
                        <div className="flex-1 p-6 md:p-8">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-100">{t('congress.open', 'Регистрация открыта')}</span>
                          </div>
                          <h3 className="text-xl md:text-2xl text-stone-800 mb-4 group-hover:text-cyan-700 transition-colors leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{L(c, 'title')}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-4">
                            {c.date_start && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span style={{ fontFamily: 'Georgia, serif' }}>{formatDateRange(c.date_start, c.date_end)}</span>
                              </div>
                            )}
                            {c.location_ru && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                <span style={{ fontFamily: 'Georgia, serif' }}>{L(c, 'location')}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-stone-600 line-clamp-2 mb-4" style={{ fontFamily: 'Georgia, serif' }}>{L(c, 'description')?.substring(0, 200)}</p>
                          <div className="flex items-center gap-2 text-cyan-600 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                            <span>{t('congress.details', 'Подробнее')}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastCongresses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-stone-400 to-stone-500 rounded-xl flex items-center justify-center shadow-lg shadow-stone-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.past', 'Прошедшие конгрессы')}</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {pastCongresses.map((c, index) => (
                    <Link key={c.id} to={`/congress/${c.id}`} className="group relative block text-left bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60 hover:shadow-lg hover:border-stone-300 transition-all duration-300">
                      <div className="absolute top-4 right-4 text-6xl font-light text-stone-100 select-none" style={{ fontFamily: 'Georgia, serif' }}>{String(index + 1).padStart(2, '0')}</div>
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-600">{t('congress.completed', 'Завершён')}</span>
                          <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{formatDate(c.date_start)}</span>
                        </div>
                        <h3 className="text-lg text-stone-800 mb-3 group-hover:text-cyan-700 transition-colors leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{L(c, 'title')}</h3>
                        {c.location_ru && (
                          <p className="text-sm text-stone-500 flex items-center gap-2">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span style={{ fontFamily: 'Georgia, serif' }}>{L(c, 'location')}</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {congresses.length === 0 && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-stone-200">
                  <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.noCongresses', 'Конгрессы пока не запланированы')}</h3>
                <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.checkLater', 'Следите за обновлениями на сайте')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ==================== DETAIL PAGE ====================
  if (!congress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400" style={{ fontFamily: 'Georgia, serif' }}>{t('common.loading', 'Загрузка...')}</p>
        </div>
      </div>
    );
  }

  const isUpcoming = congress.date_start && new Date(congress.date_start) >= new Date();
  const sponsors = congress.sponsors || [];
  const programDays = congress.program_days || [];
  const allSpeakers = congress.speakers || [];

  const selectedDay = programDays.find(d => d.id === selectedDayId);
  const sections = selectedDay?.sections || [];
  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const sectionSpeakers = selectedSection?.speakers || [];

  // ==================== TAB CONTENT RENDERERS ====================
  const renderMainTab = () => (
    <div className="space-y-6">
      {/* Description */}
      {Lf('description') && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.tabs.about', 'О конгрессе')}</h2>
          </div>
          <div className="text-stone-600 leading-relaxed prose prose-stone max-w-none" style={{ fontFamily: 'Georgia, serif' }} dangerouslySetInnerHTML={{ __html: (Lf('description') || '').replace(/\n/g, '<br />') }} />
        </div>
      )}

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.sponsors.title', 'Спонсоры')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sponsors.filter(s => s.is_active).map((sponsor) => (
              <a key={sponsor.id} href={sponsor.website_url || '#'} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-cyan-200 hover:shadow-md transition-all">
                {sponsor.logo_url ? (
                  <img src={getImageUrl(sponsor.logo_url)} alt={L(sponsor, 'name')} className="w-20 h-20 object-contain mb-3" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-stone-200 to-stone-300 rounded-xl mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-stone-400">{L(sponsor, 'name').charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm text-stone-700 text-center font-medium" style={{ fontFamily: 'Georgia, serif' }}>{L(sponsor, 'name')}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {(congress.contact_publications_phone || congress.contact_registration_phone || congress.contact_participation_phone) && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.contacts.title', 'Контакты')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {congress.contact_publications_phone && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h3 className="font-medium text-stone-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.contacts.publications', 'Для авторов')}</h3>
                <div className="space-y-2 text-sm">
                  <a href={`tel:${congress.contact_publications_phone}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{congress.contact_publications_phone}</a>
                  {congress.contact_publications_email && <a href={`mailto:${congress.contact_publications_email}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{congress.contact_publications_email}</a>}
                </div>
              </div>
            )}
            {congress.contact_registration_phone && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h3 className="font-medium text-stone-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.contacts.registration', 'Для слушателей')}</h3>
                <div className="space-y-2 text-sm">
                  <a href={`tel:${congress.contact_registration_phone}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{congress.contact_registration_phone}</a>
                  {congress.contact_registration_email && <a href={`mailto:${congress.contact_registration_email}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{congress.contact_registration_email}</a>}
                </div>
              </div>
            )}
            {congress.contact_participation_phone && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h3 className="font-medium text-stone-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.contacts.participation', 'Для докладчиков')}</h3>
                <div className="space-y-2 text-sm">
                  <a href={`tel:${congress.contact_participation_phone}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{congress.contact_participation_phone}</a>
                  {congress.contact_participation_email && <a href={`mailto:${congress.contact_participation_email}`} className="flex items-center gap-2 text-stone-600 hover:text-cyan-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{congress.contact_participation_email}</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Letter */}
      {(Lf('info_letter') || Lf('info_letter_file')) && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.infoLetter.title', 'Информационное письмо')}</h2>
            </div>
            <div className="flex gap-3">
              {Lf('info_letter') && (
                <button onClick={() => setShowInfoLetter(true)} className="px-4 py-2 text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors">
                  {t('congress.infoLetter.read', 'Читать')}
                </button>
              )}
              {Lf('info_letter_file') && (
                <a href={Lf('info_letter_file')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {t('congress.infoLetter.download', 'Скачать PDF')}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRichTextTab = (field, fallbackTitle) => {
    const content = Lf(field);
    if (!content) return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
        <p className="text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.noContent', 'Информация будет добавлена позже')}</p>
      </div>
    );
    return (
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
        <div className="text-stone-600 leading-relaxed prose prose-stone max-w-none" style={{ fontFamily: 'Georgia, serif' }} dangerouslySetInnerHTML={{ __html: (content || '').replace(/\n/g, '<br />') }} />
      </div>
    );
  };

  const renderProgramTab = () => (
    <div className="space-y-6">
      {programDays.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
          <p className="text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.noContent', 'Информация будет добавлена позже')}</p>
        </div>
      ) : (
        <>
          {/* Day buttons */}
          <div className="flex flex-wrap gap-3">
            {programDays.map((day) => (
              <button
                key={day.id}
                onClick={() => { setSelectedDayId(day.id); setSelectedSectionId(day.sections?.[0]?.id || null); }}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${selectedDayId === day.id ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-white text-stone-600 border border-stone-200 hover:border-cyan-200 hover:text-cyan-600'}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {L(day, 'title')}
                {day.date && <span className="block text-xs opacity-75 mt-0.5">{formatDate(day.date)}</span>}
              </button>
            ))}
          </div>

          {/* Section buttons */}
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedSectionId === section.id ? 'bg-violet-500 text-white shadow-md' : 'bg-white text-stone-600 border border-stone-200 hover:border-violet-200 hover:text-violet-600'}`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {L(section, 'title')}
                </button>
              ))}
            </div>
          )}

          {/* Section speakers */}
          {selectedSection && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/60">
              <h3 className="text-lg text-stone-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{L(selectedSection, 'title')}</h3>
              {L(selectedSection, 'description') && (
                <p className="text-stone-500 mb-6" style={{ fontFamily: 'Georgia, serif' }}>{L(selectedSection, 'description')}</p>
              )}
              {sectionSpeakers.length > 0 ? (
                <div className="space-y-4">
                  {sectionSpeakers.map((speaker) => (
                    <div key={speaker.id} className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      {speaker.photo_url ? (
                        <img src={getImageUrl(speaker.photo_url)} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                          {L(speaker, 'last_name')} {L(speaker, 'first_name')} {L(speaker, 'patronymic')}
                        </h4>
                        {L(speaker, 'degree') && <p className="text-sm text-cyan-600">{L(speaker, 'degree')}</p>}
                        {L(speaker, 'topic') && <p className="text-sm text-stone-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>{L(speaker, 'topic')}</p>}
                        {(speaker.time_start || speaker.time_end) && (
                          <p className="text-xs text-stone-400 mt-1">{speaker.time_start?.substring(0, 5)}{speaker.time_end ? ` - ${speaker.time_end.substring(0, 5)}` : ''}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-sm" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.program.noSpeakers', 'Спикеры будут добавлены позже')}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderSpeakersTab = () => (
    <div>
      {allSpeakers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-200/60 text-center">
          <p className="text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.noContent', 'Информация будет добавлена позже')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSpeakers.filter(s => s.is_active).map((speaker) => (
            <div key={speaker.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                {speaker.photo_url ? (
                  <img src={getImageUrl(speaker.photo_url)} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-medium text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    {L(speaker, 'last_name')} {L(speaker, 'first_name')} {L(speaker, 'patronymic')}
                  </h3>
                  {L(speaker, 'degree') && <p className="text-sm text-cyan-600">{L(speaker, 'degree')}</p>}
                  {L(speaker, 'workplace') && <p className="text-sm text-stone-500 mt-1">{L(speaker, 'workplace')}</p>}
                  {L(speaker, 'topic') && <p className="text-sm text-stone-600 mt-2 italic">{L(speaker, 'topic')}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main': return renderMainTab();
      case 'about': return renderRichTextTab('about', t('congress.tabs.about'));
      case 'organizers': return renderRichTextTab('organizers', t('congress.tabs.organizers'));
      case 'program': return renderProgramTab();
      case 'speakers': return renderSpeakersTab();
      case 'youngScientists': return renderRichTextTab('young_scientists', t('congress.tabs.youngScientists'));
      default: return renderMainTab();
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {congress.image_url ? (
          <div className="absolute inset-0">
            <img src={getImageUrl(congress.image_url)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60"></div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
          </div>
        )}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-cyan-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-cyan-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-teal-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-teal-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('nav.home', 'Главная')}</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            {congresses.length > 1 ? (
              <>
                <Link to="/congress" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.title', 'Конгрессы')}</Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white line-clamp-1" style={{ fontFamily: 'Georgia, serif' }}>{L(congress, 'title').substring(0, 40)}...</span>
              </>
            ) : (
              <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.title', 'Конгресс')}</span>
            )}
          </nav>

          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isUpcoming ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'}`}>
              {isUpcoming && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
              {isUpcoming ? t('congress.upcoming', 'Предстоящий') : t('congress.completed', 'Завершён')}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <div className="w-1.5 h-1.5 rotate-45 bg-cyan-400"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-4 leading-tight max-w-4xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {L(congress, 'title')}
          </h1>

          <div className="flex flex-wrap gap-6 text-slate-300">
            {congress.date_start && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span style={{ fontFamily: 'Georgia, serif' }}>{formatDateRange(congress.date_start, congress.date_end)}</span>
              </div>
            )}
            {congress.location_ru && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <span style={{ fontFamily: 'Georgia, serif' }}>{L(congress, 'location')}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative bg-white border-b border-stone-200 sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.key ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-8 sm:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {renderTabContent()}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration */}
              {isUpcoming && congress.registration_open && (
                <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden sticky top-32">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-cyan-500/30"></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-cyan-500/30"></div>
                  <div className="relative">
                    <h3 className="text-lg text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.register', 'Регистрация')}</h3>
                    <div className="flex items-center justify-between text-sm mb-6 pb-4 border-b border-slate-700">
                      <span className="text-slate-400">{t('congress.status', 'Статус')}:</span>
                      <span className="text-green-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        {t('congress.open', 'Открыта')}
                      </span>
                    </div>
                    <button onClick={() => setShowRegistration(true)} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-teal-500 transition-all shadow-lg shadow-cyan-500/20">
                      {t('congress.register', 'Регистрация')}
                    </button>
                  </div>
                </div>
              )}

              {/* Location */}
              {congress.location_ru && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    </div>
                    <h3 className="text-lg text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.location', 'Место проведения')}</h3>
                  </div>
                  <p className="text-stone-600" style={{ fontFamily: 'Georgia, serif' }}>{L(congress, 'location')}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-600"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.registrationForm.title', 'Регистрация на конгресс')}</h2>
              <button onClick={() => setShowRegistration(false)} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ФИО row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'last_name', label: t('congress.registrationForm.lastName', 'Фамилия'), required: true },
                  { name: 'first_name', label: t('congress.registrationForm.firstName', 'Имя'), required: true },
                  { name: 'patronymic', label: t('congress.registrationForm.patronymic', 'Отчество') },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{field.label}{field.required ? ' *' : ''}</label>
                    <input type="text" name={field.name} value={formData[field.name]} onChange={handleChange} required={field.required} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                  </div>
                ))}
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.email', 'Email')} *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.phone', 'Телефон')}</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                </div>
              </div>

              {/* Organization + Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.organization', 'Место работы')}</label>
                  <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.position', 'Должность')}</label>
                  <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                </div>
              </div>

              {/* Academic degree + title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.academicDegree', 'Ученая степень')}</label>
                  <select name="academic_degree" value={formData.academic_degree} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-white" style={{ fontFamily: 'Georgia, serif' }}>
                    <option value="">{t('congress.registrationForm.notSelected', '— Не выбрано —')}</option>
                    <option value="candidate">{t('congress.registrationForm.candidate', 'Кандидат наук')}</option>
                    <option value="doctor">{t('congress.registrationForm.doctor', 'Доктор наук')}</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.academicTitle', 'Ученое звание')}</label>
                  <select name="academic_title" value={formData.academic_title} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-white" style={{ fontFamily: 'Georgia, serif' }}>
                    <option value="">{t('congress.registrationForm.notSelected', '— Не выбрано —')}</option>
                    <option value="docent">{t('congress.registrationForm.docent', 'Доцент')}</option>
                    <option value="professor">{t('congress.registrationForm.professor', 'Профессор')}</option>
                  </select>
                </div>
              </div>

              {/* Institution address */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.institutionAddress', 'Адрес учреждения')}</label>
                <input type="text" name="institution_address" value={formData.institution_address} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
              </div>

              {/* Participation form */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">{t('congress.registrationForm.participationForm', 'Форма участия')}</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: 'participation', label: t('congress.registrationForm.participationType', 'Участие (слушатель)') },
                    { value: 'oral_presentation', label: t('congress.registrationForm.oralPresentation', 'Устный доклад') },
                    { value: 'publication', label: t('congress.registrationForm.publication', 'Публикация тезисов') },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="participation_form" value={opt.value} checked={formData.participation_form === opt.value} onChange={handleChange} className="text-cyan-500 focus:ring-cyan-500" />
                      <span className="text-sm text-stone-700" style={{ fontFamily: 'Georgia, serif' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Report title (shown if oral_presentation or publication) */}
              {(formData.participation_form === 'oral_presentation' || formData.participation_form === 'publication') && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('congress.registrationForm.reportTitle', 'Название доклада / тезисов')}</label>
                  <input type="text" name="report_title" value={formData.report_title} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" style={{ fontFamily: 'Georgia, serif' }} />
                </div>
              )}

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_young_scientist" checked={formData.is_young_scientist} onChange={handleChange} className="rounded border-stone-300 text-cyan-500 focus:ring-cyan-500" />
                  <span className="text-sm text-stone-700" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.registrationForm.youngScientist', 'Молодой ученый (до 35 лет)')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="needs_hotel" checked={formData.needs_hotel} onChange={handleChange} className="rounded border-stone-300 text-cyan-500 focus:ring-cyan-500" />
                  <span className="text-sm text-stone-700" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.registrationForm.needsHotel', 'Нужно бронирование отеля')}</span>
                </label>
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-teal-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                {submitting ? t('common.loading', 'Загрузка...') : t('congress.registrationForm.submit', 'Отправить заявку')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Info Letter Modal */}
      {showInfoLetter && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{t('congress.infoLetter.title', 'Информационное письмо')}</h2>
              <div className="flex items-center gap-3">
                {Lf('info_letter_file') && (
                  <a href={Lf('info_letter_file')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                  </a>
                )}
                <button onClick={() => setShowInfoLetter(false)} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="prose prose-stone max-w-none" style={{ fontFamily: 'Georgia, serif' }} dangerouslySetInnerHTML={{ __html: (Lf('info_letter') || '').replace(/\n/g, '<br />') }} />
          </div>
        </div>
      )}

      {/* Registration Success Modal */}
      {registrationSuccess && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <button
              onClick={() => setRegistrationSuccess(null)}
              aria-label={t('common.close', 'Закрыть')}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-5">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-xl md:text-2xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {t('congress.successTitle', 'Регистрация прошла успешно!')}
              </h2>

              {registrationSuccess.id && (
                <div className="w-full mt-5 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-xs uppercase tracking-wider text-stone-500 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    {t('congress.yourId', 'Ваш ID регистрации')}
                  </div>
                  <div className="text-3xl font-medium text-cyan-700 select-all" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    #{registrationSuccess.id}
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm text-stone-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                {t('congress.saveIdNotice', 'Пожалуйста, сохраните этот ID — он понадобится при обращении к организаторам и для проверки статуса заявки.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Congress;
