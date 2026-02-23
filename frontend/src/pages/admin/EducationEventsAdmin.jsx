import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const EducationEventsAdmin = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('masterclass');

  const emptyEvent = {
    event_type: 'masterclass',
    title_ru: '', title_uz: '', title_en: '',
    description_ru: '', description_uz: '', description_en: '',
    program_ru: '', program_uz: '', program_en: '',
    location_ru: '', location_uz: '', location_en: '',
    speaker_ru: '', speaker_uz: '', speaker_en: '',
    date_start: '', date_end: '',
    image_url: '',
    registration_url: '',
    registration_open: true,
    order: 0, is_active: true
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getEducationEvents(true);
      setEvents(res.data);
    } catch (err) {
      console.error('Error loading education events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateEducationEvent(editModal.id, editModal);
      } else {
        await contentAPI.createEducationEvent(editModal);
      }
      await loadData();
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
      await contentAPI.deleteEducationEvent(id);
      setEvents(events.filter(e => e.id !== id));
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

  const filteredEvents = events.filter(e => e.event_type === activeTab);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Образовательные мероприятия</h1>
        <button
          onClick={() => setEditModal({ ...emptyEvent, event_type: activeTab })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('masterclass')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'masterclass'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Мастерклассы
        </button>
        <button
          onClick={() => setActiveTab('webinar')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'webinar'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Вебинары
        </button>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{event.title_ru}</h3>
                  {!event.is_active && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Неактивен
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  {event.date_start && (
                    <span>{formatDate(event.date_start)}</span>
                  )}
                  {event.date_end && (
                    <span> — {formatDate(event.date_end)}</span>
                  )}
                </div>
                {event.location_ru && (
                  <p className="text-sm text-gray-400">{event.location_ru}</p>
                )}
              </div>
              <div className="text-sm text-gray-400">#{event.order}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal({ ...event })}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteModal(event)}
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

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            {activeTab === 'masterclass' ? 'Мастерклассов' : 'Вебинаров'} пока нет. Добавьте первое мероприятие.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} {editModal.event_type === 'masterclass' ? 'мастеркласс' : 'вебинар'}
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Title - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU) *</label>
                  <input
                    type="text"
                    value={editModal.title_ru}
                    onChange={(e) => updateField('title_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Название мероприятия"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (UZ)</label>
                  <input
                    type="text"
                    value={editModal.title_uz}
                    onChange={(e) => updateField('title_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Tadbir nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={editModal.title_en}
                    onChange={(e) => updateField('title_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Event title"
                  />
                </div>
              </div>

              {/* Description - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание (RU)</label>
                  <textarea
                    value={editModal.description_ru || ''}
                    onChange={(e) => updateField('description_ru', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif (UZ)</label>
                  <textarea
                    value={editModal.description_uz || ''}
                    onChange={(e) => updateField('description_uz', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                  <textarea
                    value={editModal.description_en || ''}
                    onChange={(e) => updateField('description_en', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Program - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Программа (RU)</label>
                  <textarea
                    value={editModal.program_ru || ''}
                    onChange={(e) => updateField('program_ru', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dastur (UZ)</label>
                  <textarea
                    value={editModal.program_uz || ''}
                    onChange={(e) => updateField('program_uz', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program (EN)</label>
                  <textarea
                    value={editModal.program_en || ''}
                    onChange={(e) => updateField('program_en', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Speaker - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Спикер (RU)</label>
                  <input
                    type="text"
                    value={editModal.speaker_ru || ''}
                    onChange={(e) => updateField('speaker_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="ФИО спикера"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spiker (UZ)</label>
                  <input
                    type="text"
                    value={editModal.speaker_uz || ''}
                    onChange={(e) => updateField('speaker_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Spiker ismi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Speaker (EN)</label>
                  <input
                    type="text"
                    value={editModal.speaker_en || ''}
                    onChange={(e) => updateField('speaker_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Speaker name"
                  />
                </div>
              </div>

              {/* Location - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Место проведения (RU)</label>
                  <input
                    type="text"
                    value={editModal.location_ru || ''}
                    onChange={(e) => updateField('location_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Адрес или ссылка"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joylashuv (UZ)</label>
                  <input
                    type="text"
                    value={editModal.location_uz || ''}
                    onChange={(e) => updateField('location_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Manzil yoki havola"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (EN)</label>
                  <input
                    type="text"
                    value={editModal.location_en || ''}
                    onChange={(e) => updateField('location_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Address or link"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
                  <input
                    type="datetime-local"
                    value={editModal.date_start || ''}
                    onChange={(e) => updateField('date_start', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                  <input
                    type="datetime-local"
                    value={editModal.date_end || ''}
                    onChange={(e) => updateField('date_end', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Image */}
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

              {/* Registration URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на регистрацию</label>
                <input
                  type="text"
                  value={editModal.registration_url || ''}
                  onChange={(e) => updateField('registration_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Order & Checkboxes */}
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
                    id="registration_open"
                    checked={editModal.registration_open}
                    onChange={(e) => updateField('registration_open', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="registration_open" className="text-sm text-gray-700">Регистрация открыта</label>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить мероприятие?</h3>
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

export default EducationEventsAdmin;
