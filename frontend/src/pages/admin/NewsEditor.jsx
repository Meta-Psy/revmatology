import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';

const NewsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title_ru: '',
    title_uz: '',
    title_en: '',
    content_ru: '',
    content_uz: '',
    content_en: '',
    image_url: '',
    is_published: false,
  });
  const [activeTab, setActiveTab] = useState('ru');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadNews();
    }
  }, [id]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await newsAPI.getById(id);
      setFormData(res.data);
    } catch (err) {
      console.error('Error loading news:', err);
      // Mock data for demo
      setFormData({
        title_ru: 'Пример заголовка',
        title_uz: 'Sarlavha namunasi',
        title_en: 'Example title',
        content_ru: 'Содержание новости на русском языке...',
        content_uz: 'Yangilik mazmuni o\'zbek tilida...',
        content_en: 'News content in English...',
        image_url: '',
        is_published: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await newsAPI.update(id, formData);
      } else {
        await newsAPI.create(formData);
      }
      navigate('/admin/news');
    } catch (err) {
      console.error('Error saving news:', err);
      // For demo, just navigate
      navigate('/admin/news');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'ru', label: 'Русский' },
    { id: 'uz', label: "O'zbek" },
    { id: 'en', label: 'English' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/news')}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Редактировать новость' : 'Новая новость'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Language Tabs */}
          <div className="border-b">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заголовок ({tabs.find(t => t.id === activeTab)?.label}) *
              </label>
              <input
                type="text"
                name={`title_${activeTab}`}
                value={formData[`title_${activeTab}`]}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Введите заголовок новости"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Содержание ({tabs.find(t => t.id === activeTab)?.label}) *
              </label>
              <textarea
                name={`content_${activeTab}`}
                value={formData[`content_${activeTab}`]}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Введите текст новости..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Поддерживается Markdown разметка
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL изображения
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Publish Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_published"
                id="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
              />
              <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                Опубликовать новость
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/news')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewsEditor;
