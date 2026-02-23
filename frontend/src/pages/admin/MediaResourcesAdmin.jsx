import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const MediaResourcesAdmin = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ file: false, image: false });
  const [activeTab, setActiveTab] = useState('journal');

  const tabs = [
    { key: 'journal', label: 'Журналы' },
    { key: 'article', label: 'Статьи' },
    { key: 'book', label: 'Книги' },
  ];

  const emptyResource = {
    resource_type: 'journal',
    title_ru: '', title_uz: '', title_en: '',
    description_ru: '', description_uz: '', description_en: '',
    author_name_ru: '', author_name_uz: '', author_name_en: '',
    file_url: '',
    external_url: '',
    image_url: '',
    published_date: '',
    order: 0, is_active: true
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getMediaResources(true);
      setResources(res.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(r => r.resource_type === activeTab);

  const handleSaveResource = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateMediaResource(editModal.id, editModal);
      } else {
        await contentAPI.createMediaResource(editModal);
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

  const handleDeleteResource = async (id) => {
    try {
      await contentAPI.deleteMediaResource(id);
      setResources(resources.filter(r => r.id !== id));
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
      const fieldName = fileType === 'file' ? 'file_url' : 'image_url';
      setEditModal({ ...editModal, [fieldName]: res.data.url });
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleRemoveFile = (fileType) => {
    const fieldName = fileType === 'file' ? 'file_url' : 'image_url';
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
        <h1 className="text-2xl font-bold text-gray-800">Медиаресурсы</h1>
        <button
          onClick={() => setEditModal({ ...emptyResource, resource_type: activeTab })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs text-gray-400">
              ({resources.filter(r => r.resource_type === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="grid gap-4">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{resource.title_ru}</h3>
                  {!resource.is_active && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Неактивен
                    </span>
                  )}
                </div>
                {resource.author_name_ru && (
                  <p className="text-sm text-gray-600 mb-1">{resource.author_name_ru}</p>
                )}
                {resource.published_date && (
                  <p className="text-xs text-gray-400 mb-3">{resource.published_date}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {resource.file_url ? (
                    <a
                      href={`http://localhost:8000${resource.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Файл
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Нет файла
                    </span>
                  )}
                  {resource.external_url ? (
                    <a
                      href={resource.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ссылка
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Нет ссылки
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400">#{resource.order}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal({ ...resource })}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteModal(resource)}
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

        {filteredResources.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            Ресурсов пока нет. Добавьте первый ресурс.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editModal.id ? 'Редактировать' : 'Добавить'} ресурс
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
                    placeholder="Название ресурса"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (UZ)</label>
                  <input
                    type="text"
                    value={editModal.title_uz}
                    onChange={(e) => updateField('title_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Resurs nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={editModal.title_en}
                    onChange={(e) => updateField('title_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Resource title"
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

              {/* Author name - 3 languages */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Автор (RU)</label>
                  <input
                    type="text"
                    value={editModal.author_name_ru || ''}
                    onChange={(e) => updateField('author_name_ru', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Имя автора"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muallif (UZ)</label>
                  <input
                    type="text"
                    value={editModal.author_name_uz || ''}
                    onChange={(e) => updateField('author_name_uz', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Muallif ismi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author (EN)</label>
                  <input
                    type="text"
                    value={editModal.author_name_en || ''}
                    onChange={(e) => updateField('author_name_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Author name"
                  />
                </div>
              </div>

              {/* File & Image Uploads */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Файлы
                </h4>

                <div className="grid grid-cols-2 gap-6">
                  {/* File Upload */}
                  <div className="p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-blue-900">Файл документа</span>
                    </div>

                    {editModal.file_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8000${editModal.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-blue-600 hover:underline truncate"
                        >
                          {editModal.file_url.split('/').pop()}
                        </a>
                        <button
                          onClick={() => handleRemoveFile('file')}
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
                          onChange={(e) => handleFileUpload(e, 'file')}
                          className="hidden"
                          disabled={uploading.file}
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm text-blue-700">
                          {uploading.file ? (
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

                  {/* Image Upload (Cover) */}
                  <div className="p-4 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-emerald-900">Обложка</span>
                    </div>

                    {editModal.image_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8000${editModal.image_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-emerald-600 hover:underline truncate"
                        >
                          {editModal.image_url.split('/').pop()}
                        </a>
                        <button
                          onClick={() => handleRemoveFile('image')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Удалить изображение"
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
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={(e) => handleFileUpload(e, 'image')}
                          className="hidden"
                          disabled={uploading.image}
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors text-sm text-emerald-700">
                          {uploading.image ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Загрузить изображение
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* External URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Внешняя ссылка</label>
                <input
                  type="text"
                  value={editModal.external_url || ''}
                  onChange={(e) => updateField('external_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="https://example.com/article"
                />
              </div>

              {/* Published date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата публикации</label>
                <input
                  type="date"
                  value={editModal.published_date || ''}
                  onChange={(e) => updateField('published_date', e.target.value)}
                  className="w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
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
                onClick={handleSaveResource}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить ресурс?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить "{deleteModal.title_ru}"? Прикреплённые файлы также будут удалены.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteResource(deleteModal.id)}
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

export default MediaResourcesAdmin;
