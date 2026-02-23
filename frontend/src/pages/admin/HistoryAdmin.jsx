import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const HistoryAdmin = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyHistory = {
    title_ru: '', title_uz: '', title_en: '',
    content_ru: '', content_uz: '', content_en: '',
    image_url: '',
    year: null,
    order: 0, is_active: true
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await contentAPI.getHistory(true);
      setHistory(res.data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateHistory(editModal.id, editModal);
      } else {
        await contentAPI.createHistory(editModal);
      }
      await loadHistory();
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
      await contentAPI.deleteHistory(id);
      setHistory(history.filter(h => h.id !== id));
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, image_url: res.data.url });
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const sortedHistory = [...history].sort((a, b) => {
    if ((a.year || 0) !== (b.year || 0)) return (a.year || 0) - (b.year || 0);
    return (a.order || 0) - (b.order || 0);
  });

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
        <h1 className="text-2xl font-bold text-gray-800">История Ассоциации</h1>
        <button
          onClick={() => setEditModal({ ...emptyHistory })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить запись
        </button>
      </div>

      {/* History List */}
      <div className="grid gap-4">
        {sortedHistory.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              {/* Year Badge */}
              <div className="w-16 h-16 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-cyan-700">
                  {item.year || '—'}
                </span>
              </div>

              {/* Image Thumbnail */}
              {item.image_url && (
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{item.title_ru}</h3>
                  {!item.is_active && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Неактивен
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {stripHtml(item.content_ru)}
                </p>
              </div>
              <div className="text-sm text-gray-400">#{item.order}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal({ ...item })}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteModal(item)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Удалить"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            Записей истории пока нет. Добавьте первую запись.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} запись истории
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Title - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок (RU) *</label>
                  <input
                    type="text"
                    value={editModal.title_ru}
                    onChange={(e) => updateField('title_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Основание Ассоциации"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha (UZ)</label>
                  <input
                    type="text"
                    value={editModal.title_uz}
                    onChange={(e) => updateField('title_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Assotsiatsiya tashkil etilishi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={editModal.title_en}
                    onChange={(e) => updateField('title_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Foundation of the Association"
                  />
                </div>
              </div>

              {/* Content - 3 languages (HTML supported) */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Контент (поддерживается HTML)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Контент (RU)</label>
                    <textarea
                      value={editModal.content_ru || ''}
                      onChange={(e) => updateField('content_ru', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                      placeholder="<p>Описание события...</p>"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontent (UZ)</label>
                    <textarea
                      value={editModal.content_uz || ''}
                      onChange={(e) => updateField('content_uz', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                      placeholder="<p>Voqea tavsifi...</p>"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content (EN)</label>
                    <textarea
                      value={editModal.content_en || ''}
                      onChange={(e) => updateField('content_en', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                      placeholder="<p>Event description...</p>"
                    />
                  </div>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Год</label>
                <input
                  type="number"
                  value={editModal.year || ''}
                  onChange={(e) => updateField('year', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="2005"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Изображение</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden">
                    {editModal.image_url ? (
                      <img src={editModal.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Order & Active */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                  <input
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editModal.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Активен</label>
                </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить запись?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить "{deleteModal.title_ru}"?
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

export default HistoryAdmin;
