import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { contentAPI } from '../../services/api';

const NewsAdmin = () => {
  const { i18n } = useTranslation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const emptyNews = {
    news_type: 'news',
    title_ru: '', title_uz: '', title_en: '',
    subtitle_ru: '', subtitle_uz: '', subtitle_en: '',
    content_ru: '', content_uz: '', content_en: '',
    excerpt_ru: '', excerpt_uz: '', excerpt_en: '',
    image_url: '',
    background_image_url: '',
    event_date_start: '',
    event_date_end: '',
    event_location_ru: '', event_location_uz: '', event_location_en: '',
    registration_url: '',
    is_published: false,
    is_featured: false
  };

  useEffect(() => {
    loadNews();
  }, [filter]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const newsType = filter === 'all' ? null : filter;
      const res = await contentAPI.getNews(newsType, false, 0, 100);
      setNews(res.data);
    } catch (err) {
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (item) => {
    const lang = i18n.language;
    return item[`title_${lang}`] || item.title_ru;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...editModal };
      if (!data.event_date_start) data.event_date_start = null;
      if (!data.event_date_end) data.event_date_end = null;

      if (editModal.id) {
        await contentAPI.updateNews(editModal.id, data);
      } else {
        await contentAPI.createNews(data);
      }
      await loadNews();
      setEditModal(null);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await contentAPI.deleteNews(id);
      setNews(news.filter(n => n.id !== id));
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting news:', err);
    }
  };

  const togglePublish = async (item) => {
    try {
      await contentAPI.updateNews(item.id, { is_published: !item.is_published });
      setNews(news.map(n => n.id === item.id ? { ...n, is_published: !n.is_published } : n));
    } catch (err) {
      console.error('Error updating news:', err);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, [field]: res.data.url });
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.slice(0, 16);
  };

  const openEditModal = (item) => {
    setEditModal({
      ...item,
      event_date_start: formatDate(item.event_date_start),
      event_date_end: formatDate(item.event_date_end)
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Новости и события</h1>
        <button
          onClick={() => setEditModal({ ...emptyNews })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('news')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'news' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Новости
        </button>
        <button
          onClick={() => setFilter('event')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'event' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          События
        </button>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заголовок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                      {getTitle(item)}
                    </div>
                    {item.is_featured && (
                      <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                        В карусели
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.news_type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.news_type === 'event' ? 'Событие' : 'Новость'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {item.event_date_start
                      ? new Date(item.event_date_start).toLocaleDateString('ru-RU')
                      : new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => togglePublish(item)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.is_published ? 'Опубликовано' : 'Черновик'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Редактировать"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteModal(item)}
                      className="text-red-500 hover:text-red-700"
                      title="Удалить"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {news.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filter === 'all' ? 'Новостей пока нет' : filter === 'news' ? 'Новостей пока нет' : 'Событий пока нет'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} {editModal.news_type === 'event' ? 'событие' : 'новость'}
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Type & Featured */}
              <div className="flex items-center gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="news_type"
                        value="news"
                        checked={editModal.news_type === 'news'}
                        onChange={(e) => updateField('news_type', e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm">Новость</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="news_type"
                        value="event"
                        checked={editModal.news_type === 'event'}
                        onChange={(e) => updateField('news_type', e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm">Событие</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={editModal.is_featured}
                    onChange={(e) => updateField('is_featured', e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="is_featured" className="text-sm text-gray-700">Показывать в карусели</label>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editModal.news_type === 'event' ? 'Картинка события' : 'Картинка новости'}
                  </label>
                  <div className="flex items-center gap-4">
                    {editModal.image_url && (
                      <img src={editModal.image_url} alt="" className="w-24 h-16 object-cover rounded-lg" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'image_url')}
                      className="text-sm"
                    />
                  </div>
                </div>
                {editModal.news_type === 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Фоновая картинка</label>
                    <div className="flex items-center gap-4">
                      {editModal.background_image_url && (
                        <img src={editModal.background_image_url} alt="" className="w-24 h-16 object-cover rounded-lg" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'background_image_url')}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Title - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок (RU) *</label>
                  <input
                    type="text"
                    value={editModal.title_ru}
                    onChange={(e) => updateField('title_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha (UZ) *</label>
                  <input
                    type="text"
                    value={editModal.title_uz}
                    onChange={(e) => updateField('title_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN) *</label>
                  <input
                    type="text"
                    value={editModal.title_en}
                    onChange={(e) => updateField('title_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Subtitle for news */}
              {editModal.news_type === 'news' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок (RU)</label>
                    <input
                      type="text"
                      value={editModal.subtitle_ru || ''}
                      onChange={(e) => updateField('subtitle_ru', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Раскрывает суть новости"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quyi sarlavha (UZ)</label>
                    <input
                      type="text"
                      value={editModal.subtitle_uz || ''}
                      onChange={(e) => updateField('subtitle_uz', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                    <input
                      type="text"
                      value={editModal.subtitle_en || ''}
                      onChange={(e) => updateField('subtitle_en', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Excerpt - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание (RU)</label>
                  <textarea
                    value={editModal.excerpt_ru || ''}
                    onChange={(e) => updateField('excerpt_ru', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qisqa tavsif (UZ)</label>
                  <textarea
                    value={editModal.excerpt_uz || ''}
                    onChange={(e) => updateField('excerpt_uz', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short description (EN)</label>
                  <textarea
                    value={editModal.excerpt_en || ''}
                    onChange={(e) => updateField('excerpt_en', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Content - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Содержание (RU) *</label>
                  <textarea
                    value={editModal.content_ru}
                    onChange={(e) => updateField('content_ru', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mazmun (UZ) *</label>
                  <textarea
                    value={editModal.content_uz}
                    onChange={(e) => updateField('content_uz', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content (EN) *</label>
                  <textarea
                    value={editModal.content_en}
                    onChange={(e) => updateField('content_en', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Event fields */}
              {editModal.news_type === 'event' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
                      <input
                        type="datetime-local"
                        value={editModal.event_date_start || ''}
                        onChange={(e) => updateField('event_date_start', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                      <input
                        type="datetime-local"
                        value={editModal.event_date_end || ''}
                        onChange={(e) => updateField('event_date_end', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Место проведения (RU)</label>
                      <input
                        type="text"
                        value={editModal.event_location_ru || ''}
                        onChange={(e) => updateField('event_location_ru', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="г. Ташкент"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">O'tkazilish joyi (UZ)</label>
                      <input
                        type="text"
                        value={editModal.event_location_uz || ''}
                        onChange={(e) => updateField('event_location_uz', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Toshkent sh."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location (EN)</label>
                      <input
                        type="text"
                        value={editModal.event_location_en || ''}
                        onChange={(e) => updateField('event_location_en', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Tashkent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на регистрацию</label>
                    <input
                      type="url"
                      value={editModal.registration_url || ''}
                      onChange={(e) => updateField('registration_url', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="https://forms.google.com/..."
                    />
                  </div>
                </>
              )}

              {/* Publish */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editModal.is_published}
                  onChange={(e) => updateField('is_published', e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">Опубликовать</label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить "{getTitle(deleteModal)}"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
