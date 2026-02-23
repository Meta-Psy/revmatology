import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

const BoardMembers = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getBoardMembers();
      setBoardMembers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading board members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getField = (item, field) => {
    return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400" style={{ fontFamily: 'Georgia, serif' }}>
            {lang === 'ru' ? 'Загрузка...' : lang === 'uz' ? 'Yuklanmoqda...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Corner accents */}
        <div className="hidden sm:block absolute top-6 left-6 w-10 h-10 border-t border-l border-sky-500/20"></div>
        <div className="hidden sm:block absolute top-6 right-6 w-10 h-10 border-t border-r border-sky-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 left-6 w-10 h-10 border-b border-l border-blue-500/20"></div>
        <div className="hidden sm:block absolute bottom-6 right-6 w-10 h-10 border-b border-r border-blue-500/20"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
              {t('nav.home', 'Главная')}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white" style={{ fontFamily: 'Georgia, serif' }}>
              {t('boardMembersPage.title', 'Члены правления')}
            </span>
          </nav>

          <div className="lg:max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-sky-400"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                {t('boardMembersPage.title', 'Члены правления')}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {t('boardMembersPage.subtitle', 'Ведущие специалисты, посвятившие свою жизнь развитию ревматологии в Узбекистане')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-sky-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-3xl"></div>

        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {boardMembers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>
                {lang === 'ru' ? 'Члены правления не найдены' : lang === 'uz' ? "Boshqaruv a'zolari topilmadi" : 'No board members found'}
              </p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16 md:space-y-20">
              {boardMembers.map((member, index) => {
                const isEven = index % 2 === 0;

                return (
                  <article key={member.id} className="relative">
                    {/* Background number */}
                    <div
                      className={`absolute -top-2 ${isEven ? 'left-0' : 'right-0'} text-[60px] sm:text-[80px] md:text-[100px] font-light text-stone-200/50 select-none -z-10 leading-none`}
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 sm:gap-10 md:gap-12 items-start`}>
                      {/* Portrait */}
                      <div className="w-full sm:w-3/4 md:w-5/12 flex-shrink-0 mx-auto md:mx-0">
                        <div className="relative group/photo max-w-[280px] sm:max-w-none mx-auto">
                          {/* Outer frame */}
                          <div className="absolute -inset-2 sm:-inset-3 border border-amber-700/20 rounded-sm group-hover/photo:border-amber-600/30 transition-colors duration-500"></div>
                          <div className="absolute -inset-1 sm:-inset-1.5 border border-stone-300/50 rounded-sm"></div>

                          {/* Photo */}
                          <div className="relative aspect-[3/4] bg-stone-100 shadow-lg group-hover/photo:shadow-xl group-hover/photo:shadow-stone-300/50 transition-shadow duration-500">
                            {member.photo_url ? (
                              <img
                                src={`http://localhost:8000${member.photo_url}`}
                                alt={`${getField(member, 'last_name')} ${getField(member, 'first_name')}`}
                                className="w-full h-full object-cover grayscale-[15%] sepia-[5%] group-hover/photo:grayscale-[5%] group-hover/photo:sepia-0 transition-all duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200">
                                <svg className="w-16 sm:w-24 h-16 sm:h-24 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Position badge */}
                          {getField(member, 'position') && (
                            <div className="absolute -bottom-5 sm:-bottom-6 left-0 right-0 text-center">
                              <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-stone-800 text-stone-100 text-[10px] sm:text-xs tracking-wider uppercase rounded-sm shadow-md group-hover/photo:shadow-lg group-hover/photo:bg-stone-700 transition-all duration-300" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {getField(member, 'position')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="w-full md:w-7/12 pt-4 sm:pt-6 md:pt-0">
                        {/* Name */}
                        <h3 className="text-xl sm:text-2xl md:text-3xl text-stone-800 mb-2 leading-snug tracking-tight text-center md:text-left" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                          {getField(member, 'last_name')}{' '}
                          {getField(member, 'first_name')}{' '}
                          <span className="text-stone-500">{getField(member, 'patronymic')}</span>
                        </h3>

                        {/* Separator */}
                        <div className="flex items-center gap-2 my-4">
                          <div className="w-14 h-px bg-gradient-to-r from-amber-700/40 to-blue-500/20"></div>
                          <div className="w-1.5 h-1.5 bg-amber-700/40 rotate-45"></div>
                        </div>

                        {/* Degree */}
                        {getField(member, 'degree') && (
                          <p className="text-base md:text-lg text-amber-900/70 mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            <em>{getField(member, 'degree')}</em>
                          </p>
                        )}

                        {/* Workplace */}
                        {getField(member, 'workplace') && (
                          <div className="mb-6 flex items-start gap-3">
                            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                              {getField(member, 'workplace')}
                            </p>
                          </div>
                        )}

                        {/* Bio */}
                        {getField(member, 'bio') && (
                          <div className="relative mb-7">
                            <div className="absolute -left-1 -top-3 text-5xl text-stone-200/80 leading-none select-none" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                              &ldquo;
                            </div>
                            <div className="pl-6 border-l-2 border-stone-200">
                              <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                <em>{getField(member, 'bio')}</em>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Achievements */}
                        {getField(member, 'achievements') && (
                          <div className="mb-7 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-600/60 via-sky-500/30 to-transparent"></div>
                            <div className="pl-5">
                              <h4 className="text-xs font-medium text-amber-800/70 uppercase tracking-[0.2em] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {lang === 'ru' ? 'Достижения и награды' : lang === 'uz' ? "Yutuqlar va mukofotlar" : 'Achievements and awards'}
                              </h4>
                              <p className="text-stone-600 text-base leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {getField(member, 'achievements')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Contacts */}
                        {(member.email || member.phone) && (
                          <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-stone-200">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="group flex items-center gap-2.5 text-stone-500 hover:text-sky-700 transition-all duration-300"
                              >
                                <span className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center group-hover:border-sky-400 group-hover:bg-sky-50/50 transition-all duration-300">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </span>
                                <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{member.email}</span>
                              </a>
                            )}
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="group flex items-center gap-2.5 text-stone-500 hover:text-sky-700 transition-all duration-300"
                              >
                                <span className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center group-hover:border-sky-400 group-hover:bg-sky-50/50 transition-all duration-300">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </span>
                                <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{member.phone}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BoardMembers;
