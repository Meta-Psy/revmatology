import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const DiseasesAdmin = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ recommendation: false, protocol: false });

  const emptyDisease = {
    name_ru: '', name_uz: '', name_en: '',
    short_name: '',
    description_ru: '', description_uz: '', description_en: '',
    symptoms_ru: '', symptoms_uz: '', symptoms_en: '',
    treatment_ru: '', treatment_uz: '', treatment_en: '',
    recommendation_file_url: '',
    protocol_file_url: '',
    order: 0, is_active: true
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getDiseases(true);
      setDiseases(res.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisease = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateDisease(editModal.id, editModal);
      } else {
        await contentAPI.createDisease(editModal);
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

  const handleDeleteDisease = async (id) => {
    try {
      await contentAPI.deleteDisease(id);
      setDiseases(diseases.filter(d => d.id !== id));
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [fileType]: true }));
    try {
      const res = await contentAPI.uploadFile(file);
      const fieldName = fileType === 'recommendation' ? 'recommendation_file_url' : 'protocol_file_url';
      setEditModal({ ...editModal, [fieldName]: res.data.url });
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleRemoveFile = (fileType) => {
    const fieldName = fileType === 'recommendation' ? 'recommendation_file_url' : 'protocol_file_url';
    setEditModal({ ...editModal, [fieldName]: '' });
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
        <h1 className="text-2xl font-bold text-gray-800">Нормативные документы</h1>
        <button
          onClick={() => setEditModal({ ...emptyDisease })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить заболевание
        </button>
      </div>

      {/* Diseases List */}
      <div className="grid gap-4">
        {diseases.map((disease) => (
          <div key={disease.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{disease.name_ru}</h3>
                  {disease.short_name && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {disease.short_name}
                    </span>
                  )}
                  {!disease.is_active && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Неактивен
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{disease.description_ru}</p>

                {/* Documents badges */}
                <div className="flex flex-wrap gap-2">
                  {disease.recommendation_file_url ? (
                    <a
                      href={`http://localhost:8000${disease.recommendation_file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Клинические рекомендации
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Нет рекомендаций
                    </span>
                  )}
                  {disease.protocol_file_url ? (
                    <a
                      href={`http://localhost:8000${disease.protocol_file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Клинический протокол
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Нет протокола
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400">#{disease.order}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal({ ...disease })}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteModal(disease)}
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

        {diseases.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            Заболеваний пока нет. Добавьте первое заболевание.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} заболевание
            </h3>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Name - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU) *</label>
                  <input
                    type="text"
                    value={editModal.name_ru}
                    onChange={(e) => updateField('name_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Ревматоидный артрит"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (UZ)</label>
                  <input
                    type="text"
                    value={editModal.name_uz}
                    onChange={(e) => updateField('name_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Revmatoid artrit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
                  <input
                    type="text"
                    value={editModal.name_en}
                    onChange={(e) => updateField('name_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Rheumatoid Arthritis"
                  />
                </div>
              </div>

              {/* Short name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Краткое название / аббревиатура</label>
                <input
                  type="text"
                  value={editModal.short_name || ''}
                  onChange={(e) => updateField('short_name', e.target.value)}
                  className="w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="РА"
                />
              </div>

              {/* Description */}
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

              {/* Documents Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Прикреплённые документы
                </h4>

                <div className="grid grid-cols-2 gap-6">
                  {/* Clinical Recommendations */}
                  <div className="p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-blue-900">Клинические рекомендации</span>
                    </div>

                    {editModal.recommendation_file_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8000${editModal.recommendation_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-blue-600 hover:underline truncate"
                        >
                          {editModal.recommendation_file_url.split('/').pop()}
                        </a>
                        <button
                          onClick={() => handleRemoveFile('recommendation')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Удалить файл"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'recommendation')}
                          className="hidden"
                          disabled={uploading.recommendation}
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm text-blue-700">
                          {uploading.recommendation ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Загрузить PDF
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Clinical Protocol */}
                  <div className="p-4 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-emerald-900">Клинический протокол</span>
                    </div>

                    {editModal.protocol_file_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8000${editModal.protocol_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-emerald-600 hover:underline truncate"
                        >
                          {editModal.protocol_file_url.split('/').pop()}
                        </a>
                        <button
                          onClick={() => handleRemoveFile('protocol')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Удалить файл"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'protocol')}
                          className="hidden"
                          disabled={uploading.protocol}
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors text-sm text-emerald-700">
                          {uploading.protocol ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Загрузить PDF
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
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
                onClick={handleSaveDisease}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить заболевание?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить "{deleteModal.name_ru}"? Прикреплённые документы также будут удалены.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteDisease(deleteModal.id)}
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

export default DiseasesAdmin;
