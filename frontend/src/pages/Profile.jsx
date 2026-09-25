import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { contentAPI, readBlobError, filenameFromDisposition } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { makeGetField } from '../utils/getField';
import { formatDotDate } from '../utils/dates';
import { saveBlob } from '../utils/saveBlob';
import { PageLoading } from '../components/PageChunkBoundary';

// Лимит выдач на участника — константа сервера, здесь только для «N из 5»
const MAX_DOWNLOADS = 5;

const serif = { fontFamily: 'Georgia, serif' };

// Код ответа скачивания → ключ локали. Статус главнее кода, как на странице поиска.
const errorKey = (status, code) => {
  if (status === 404 || code === 'not_found') return 'profile.unavailable';
  if (status === 403 || code === 'limit_reached') return 'certificate.limitReached';
  if (status === 429 || code === 'too_many_requests') return 'certificate.tooMany';
  return 'certificate.error';
};

/**
 * Личный кабинет (К-12): учётная запись и свои сертификаты.
 * Получатели привязаны к email регистрации на конгресс — телефон здесь не нужен.
 */
const Profile = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, loading } = useAuth();
  const L = makeGetField(i18n.language);

  const [certificates, setCertificates] = useState(null); // null — ответ ещё не пришёл
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [errors, setErrors] = useState({}); // recipient_id → текст ошибки

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    contentAPI.getMyCertificates()
      .then((res) => { if (!cancelled) setCertificates(res.data || []); })
      .catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; };
  }, [user]);

  const handleDownload = async (cert) => {
    setBusyId(cert.recipient_id);
    setErrors((e) => ({ ...e, [cert.recipient_id]: '' }));
    try {
      const res = await contentAPI.downloadMyCertificate(cert.recipient_id);
      saveBlob(res.data, filenameFromDisposition(res.headers?.['content-disposition']));
      setCertificates((list) => list.map((c) => (
        c.recipient_id === cert.recipient_id
          ? { ...c, downloads_left: Math.max(0, (c.downloads_left ?? 1) - 1) }
          : c
      )));
    } catch (err) {
      const code = await readBlobError(err);
      setErrors((e) => ({ ...e, [cert.recipient_id]: t(errorKey(err?.response?.status, code)) }));
    } finally {
      setBusyId(null);
    }
  };

  // Токен ещё проверяется — не уводим на вход, иначе вошедшего выбросит на перезагрузке
  if (loading) return <PageLoading />;
  if (!user) {
    return (
      <>
        <PageLoading />
        <Navigate to="/login" replace state={{ from: location.pathname }} />
      </>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="relative py-10 md:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('profile.title')}
          </h1>
          <p className="text-slate-200" style={serif}>{user.full_name || user.short_name}</p>
          <p className="text-sm text-slate-400" style={serif}>{user.email}</p>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-50 to-white"></div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl text-stone-800 mb-4" style={serif}>{t('profile.myCertificates')}</h2>

          {loadFailed && (
            <p className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60 text-stone-500" style={serif}>
              {t('profile.loadError')}
            </p>
          )}

          {!loadFailed && certificates === null && (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" aria-label={t('common.loading')}></div>
            </div>
          )}

          {certificates?.length === 0 && (
            <p className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60 text-stone-500" style={serif}>
              {t('profile.empty')}
            </p>
          )}

          {certificates?.length > 0 && (
            <ul className="space-y-4">
              {certificates.map((cert) => (
                <li key={cert.recipient_id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h3 className="text-lg text-stone-800 mb-1" style={serif}>{L(cert, 'congress_title')}</h3>
                  <p className="text-stone-600" style={serif}>{cert.full_name}</p>
                  <p className="text-sm text-stone-400 mb-3" style={serif}>
                    {t('profile.certificateNumber', { number: String(cert.number ?? '').padStart(3, '0') })}
                  </p>

                  {cert.open ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(cert)}
                        disabled={cert.downloads_left <= 0 || busyId === cert.recipient_id}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={serif}
                      >
                        {t('certificate.download')}
                      </button>
                      <p className="text-sm text-stone-500" style={serif}>
                        {t('profile.downloadsLeft', { left: cert.downloads_left ?? 0, max: MAX_DOWNLOADS })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-stone-500" style={serif}>
                      {cert.opens_on
                        ? t('profile.availableFrom', { date: formatDotDate(cert.opens_on) })
                        : t('profile.notOpen')}
                    </p>
                  )}

                  {errors[cert.recipient_id] && (
                    <p role="alert" className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" style={serif}>
                      {errors[cert.recipient_id]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
