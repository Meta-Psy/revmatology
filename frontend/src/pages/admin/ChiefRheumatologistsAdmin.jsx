import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const ChiefRheumatologistsAdmin = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyDoctor = {
    last_name_ru: '', last_name_uz: '', last_name_en: '',
    first_name_ru: '', first_name_uz: '', first_name_en: '',
    patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
    position_ru: '', position_uz: '', position_en: '',
    degree_ru: '', degree_uz: '', degree_en: '',
    workplace_ru: '', workplace_uz: '', workplace_en: '',
    region_ru: '', region_uz: '', region_en: '',
    bio_ru: '', bio_uz: '', bio_en: '',
    achievements_ru: '', achievements_uz: '', achievements_en: '',
    photo_url: '', email: '', phone: '',
    order: 0, is_active: true
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await contentAPI.getChiefRheumatologists(true);
      setDoctors(res.data);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateChiefRheumatologist(editModal.id, editModal);
      } else {
        await contentAPI.createChiefRheumatologist(editModal);
      }
      await loadDoctors();
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
      await contentAPI.deleteChiefRheumatologist(id);
      setDoctors(doctors.filter(d => d.id !== id));
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, photo_url: res.data.url });
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
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
        <h1 className="text-2xl font-bold text-gray-800">Главные ревматологи</h1>
        <button
          onClick={() => setEditModal({ ...emptyDoctor })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Doctors Grid */}
      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              {doctor.photo_url ? (
                <img src={doctor.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {doctor.last_name_ru} {doctor.first_name_ru} {doctor.patronymic_ru}
                </h3>
                {!doctor.is_active && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Неактивен
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{doctor.position_ru}</p>
              <p className="text-xs text-cyan-600">{doctor.region_ru}</p>
            </div>
            <div className="text-sm text-gray-400">#{doctor.order}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditModal({ ...doctor })}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteModal(doctor)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {doctors.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            Главных ревматологов пока нет
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} главного ревматолога
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Фото</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden">
                    {editModal.photo_url ? (
                      <img src={editModal.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Region */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Регион (RU) *</label>
                  <input
                    type="text"
                    value={editModal.region_ru || ''}
                    onChange={(e) => updateField('region_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="г. Ташкент"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hudud (UZ) *</label>
                  <input
                    type="text"
                    value={editModal.region_uz || ''}
                    onChange={(e) => updateField('region_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Toshkent sh."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region (EN) *</label>
                  <input
                    type="text"
                    value={editModal.region_en || ''}
                    onChange={(e) => updateField('region_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Tashkent City"
                  />
                </div>
              </div>

              {/* Name - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия (RU) *</label>
                  <input
                    type="text"
                    value={editModal.last_name_ru}
                    onChange={(e) => updateField('last_name_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya (UZ) *</label>
                  <input
                    type="text"
                    value={editModal.last_name_uz}
                    onChange={(e) => updateField('last_name_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (EN) *</label>
                  <input
                    type="text"
                    value={editModal.last_name_en}
                    onChange={(e) => updateField('last_name_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя (RU) *</label>
                  <input
                    type="text"
                    value={editModal.first_name_ru}
                    onChange={(e) => updateField('first_name_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism (UZ) *</label>
                  <input
                    type="text"
                    value={editModal.first_name_uz}
                    onChange={(e) => updateField('first_name_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name (EN) *</label>
                  <input
                    type="text"
                    value={editModal.first_name_en}
                    onChange={(e) => updateField('first_name_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отчество (RU)</label>
                  <input
                    type="text"
                    value={editModal.patronymic_ru || ''}
                    onChange={(e) => updateField('patronymic_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Otasining ismi (UZ)</label>
                  <input
                    type="text"
                    value={editModal.patronymic_uz || ''}
                    onChange={(e) => updateField('patronymic_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patronymic (EN)</label>
                  <input
                    type="text"
                    value={editModal.patronymic_en || ''}
                    onChange={(e) => updateField('patronymic_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Должность (RU) *</label>
                  <input
                    type="text"
                    value={editModal.position_ru}
                    onChange={(e) => updateField('position_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Главный ревматолог"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lavozim (UZ) *</label>
                  <input
                    type="text"
                    value={editModal.position_uz}
                    onChange={(e) => updateField('position_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Bosh revmatolog"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position (EN) *</label>
                  <input
                    type="text"
                    value={editModal.position_en}
                    onChange={(e) => updateField('position_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Chief Rheumatologist"
                  />
                </div>
              </div>

              {/* Degree */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Учёная степень (RU)</label>
                  <input
                    type="text"
                    value={editModal.degree_ru || ''}
                    onChange={(e) => updateField('degree_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ilmiy daraja (UZ)</label>
                  <input
                    type="text"
                    value={editModal.degree_uz || ''}
                    onChange={(e) => updateField('degree_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree (EN)</label>
                  <input
                    type="text"
                    value={editModal.degree_en || ''}
                    onChange={(e) => updateField('degree_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Workplace */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Место работы (RU)</label>
                  <textarea
                    value={editModal.workplace_ru || ''}
                    onChange={(e) => updateField('workplace_ru', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ish joyi (UZ)</label>
                  <textarea
                    value={editModal.workplace_uz || ''}
                    onChange={(e) => updateField('workplace_uz', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workplace (EN)</label>
                  <textarea
                    value={editModal.workplace_en || ''}
                    onChange={(e) => updateField('workplace_en', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Биография / Tarjimai hol / Biography</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">RU</label>
                    <textarea
                      value={editModal.bio_ru || ''}
                      onChange={(e) => updateField('bio_ru', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Краткая биография..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">UZ</label>
                    <textarea
                      value={editModal.bio_uz || ''}
                      onChange={(e) => updateField('bio_uz', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Qisqa tarjimai hol..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">EN</label>
                    <textarea
                      value={editModal.bio_en || ''}
                      onChange={(e) => updateField('bio_en', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Brief biography..."
                    />
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Достижения и награды / Yutuqlar / Achievements</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">RU</label>
                    <textarea
                      value={editModal.achievements_ru || ''}
                      onChange={(e) => updateField('achievements_ru', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Достижения, награды, публикации..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">UZ</label>
                    <textarea
                      value={editModal.achievements_uz || ''}
                      onChange={(e) => updateField('achievements_uz', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Yutuqlar, mukofotlar, nashrlar..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">EN</label>
                    <textarea
                      value={editModal.achievements_en || ''}
                      onChange={(e) => updateField('achievements_en', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Achievements, awards, publications..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Order */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editModal.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={editModal.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                  <input
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
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
              Вы уверены, что хотите удалить {deleteModal.last_name_ru} {deleteModal.first_name_ru}?
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

export default ChiefRheumatologistsAdmin;
