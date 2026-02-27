import { useState, useEffect } from 'react';
import { Image, Upload, Check, X } from 'lucide-react';
import { contentAPI, getImageUrl } from '../../services/api';
import { PageHeader, Skeleton, useToast } from '../../components/admin';

const PAGE_KEYS = [
  { key: 'home', label: 'Главная' },
  { key: 'board_members', label: 'Члены правления' },
  { key: 'congress', label: 'Конгрессы' },
  { key: 'rheumatology', label: 'Ревматология' },
  { key: 'disease_info', label: 'Заболевания' },
  { key: 'schools', label: 'Школы' },
  { key: 'history', label: 'История' },
  { key: 'legal_docs', label: 'Нормативные документы' },
  { key: 'education_events', label: 'Образование' },
  { key: 'media_resources', label: 'Медиаресурсы' },
  { key: 'activities', label: 'Деятельность' },
  { key: 'news', label: 'Новости' },
];

const HeroImagesAdmin = () => {
  const toast = useToast();
  const [heroImages, setHeroImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getHeroImages();
      const map = {};
      (Array.isArray(res.data) ? res.data : []).forEach(h => {
        map[h.page_key] = h;
      });
      setHeroImages(map);
    } catch (error) {
      console.error('Error loading hero images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (pageKey, file) => {
    if (!file) return;
    setUploading(pageKey);
    try {
      const uploadRes = await contentAPI.uploadFile(file);
      const res = await contentAPI.updateHeroImage(pageKey, { image_url: uploadRes.data.url });
      setHeroImages(prev => ({ ...prev, [pageKey]: res.data }));
      toast.success('Изображение обновлено');
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(null);
    }
  };

  const toggleActive = async (pageKey) => {
    const current = heroImages[pageKey];
    const newActive = current ? !current.is_active : true;
    try {
      const res = await contentAPI.updateHeroImage(pageKey, { is_active: newActive });
      setHeroImages(prev => ({ ...prev, [pageKey]: res.data }));
      toast.success(newActive ? 'Фон активирован' : 'Фон деактивирован');
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  if (loading) return <Skeleton rows={4} cols={3} />;

  return (
    <div>
      <PageHeader
        title="Hero-фоны"
        subtitle="Фоновые изображения для hero-секций публичных страниц"
        icon={Image}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAGE_KEYS.map(({ key, label }) => {
          const hero = heroImages[key];
          const imageUrl = hero?.image_url ? getImageUrl(hero.image_url) : null;
          const isActive = hero?.is_active ?? false;
          const isUploading = uploading === key;

          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Preview */}
              <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-slate-600" />
                  </div>
                )}
                {imageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent" />
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-sm font-medium drop-shadow-lg">{label}</span>
                </div>
                {hero && (
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      isActive
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-500/80 text-white'
                    }`}>
                      {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {isActive ? 'Активен' : 'Выкл'}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-3 flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  isUploading
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Загрузка...' : (imageUrl ? 'Заменить' : 'Загрузить')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handleUpload(key, e.target.files[0])}
                  />
                </label>

                {hero && (
                  <button
                    onClick={() => toggleActive(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {isActive ? 'Выключить' : 'Включить'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroImagesAdmin;
