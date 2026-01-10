import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const CenterStaffAdmin = () => {
  const [staff, setStaff] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyStaff = {
    center_id: '',
    last_name_ru: '', last_name_uz: '', last_name_en: '',
    first_name_ru: '', first_name_uz: '', first_name_en: '',
    patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
    position_ru: '', position_uz: '', position_en: '',
    credentials_ru: '', credentials_uz: '', credentials_en: '',
    photo_url: '',
    order: 0, is_active: true
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStaff();
  }, [selectedCenterId]);

  const loadData = async () => {
    try {
      const centersRes = await contentAPI.getCenters(true);
      setCenters(centersRes.data);
    } catch (err) {
      console.error('Error loading centers:', err);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const centerId = selectedCenterId || null;
      const res = await contentAPI.getCenterStaff(centerId, true);
      setStaff(res.data);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editModal.center_id) {
      alert('Выберите центр');
      return;
    }

    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateStaffMember(editModal.id, editModal);
      } else {
        await contentAPI.createStaffMember(editModal);
      }
      await loadStaff();
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
      await contentAPI.deleteStaffMember(id);
      setStaff(staff.filter(s => s.id !== id));
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

  const getCenterName = (centerId) => {
    const center = centers.find(c => c.id === centerId);
    return center ? center.name_ru : 'Неизвестный центр';
  };

  const handleAddNew = () => {
    const newStaff = { ...emptyStaff };
    if (selectedCenterId) {
      newStaff.center_id = parseInt(selectedCenterId);
    }
    setEditModal(newStaff);
  };

  if (loading && centers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Сотрудники центров</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Filter by Center */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Фильтр по центру</label>
        <select
          value={selectedCenterId}
          onChange={(e) => setSelectedCenterId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="">Все центры</option>
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.name_ru}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {staff.map((person) => (
            <div key={person.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                {person.photo_url ? (
                  <img src={person.photo_url} alt="" className="w-full h-full object-cover" />
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
                    {person.last_name_ru} {person.first_name_ru} {person.patronymic_ru}
                  </h3>
                  {!person.is_active && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Неактивен
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{person.position_ru}</p>
                <p className="text-xs text-cyan-600">{getCenterName(person.center_id)}</p>
                {person.credentials_ru && (
                  <p className="text-xs text-gray-400 mt-1">{person.credentials_ru}</p>
                )}
              </div>
              <div className="text-sm text-gray-400">#{person.order}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal({ ...person })}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteModal(person)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {staff.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
              {selectedCenterId ? 'В этом центре нет сотрудников' : 'Сотрудников пока нет'}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} сотрудника
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Center Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Центр *</label>
                <select
                  value={editModal.center_id || ''}
                  onChange={(e) => updateField('center_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Выберите центр</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name_ru}
                    </option>
                  ))}
                </select>
              </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Должность (RU)</label>
                  <input
                    type="text"
                    value={editModal.position_ru || ''}
                    onChange={(e) => updateField('position_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Врач-ревматолог"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lavozim (UZ)</label>
                  <input
                    type="text"
                    value={editModal.position_uz || ''}
                    onChange={(e) => updateField('position_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Revmatolog shifokor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position (EN)</label>
                  <input
                    type="text"
                    value={editModal.position_en || ''}
                    onChange={(e) => updateField('position_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Rheumatologist"
                  />
                </div>
              </div>

              {/* Credentials (Регалии) */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Регалии (RU)</label>
                  <input
                    type="text"
                    value={editModal.credentials_ru || ''}
                    onChange={(e) => updateField('credentials_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="д.м.н., профессор"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unvonlar (UZ)</label>
                  <input
                    type="text"
                    value={editModal.credentials_uz || ''}
                    onChange={(e) => updateField('credentials_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="t.f.d., professor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credentials (EN)</label>
                  <input
                    type="text"
                    value={editModal.credentials_en || ''}
                    onChange={(e) => updateField('credentials_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="MD, PhD, Professor"
                  />
                </div>
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                  <input
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end pb-2">
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

export default CenterStaffAdmin;
