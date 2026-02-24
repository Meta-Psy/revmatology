import { useState, useEffect } from 'react';
import { Plus, BookOpen, FileText, Newspaper, BookMarked } from 'lucide-react';
import { contentAPI } from '../../services/api';
import {
  PageHeader,
  AdminTable,
  AdminModal,
  AdminForm,
  AdminFormField,
  ConfirmDialog,
  LangTabs,
  FileUpload,
  StatusBadge,
  Skeleton,
  useToast,
} from '../../components/admin';

const EMPTY_RESOURCE = {
  resource_type: 'journal',
  title_ru: '', title_uz: '', title_en: '',
  description_ru: '', description_uz: '', description_en: '',
  author_name_ru: '', author_name_uz: '', author_name_en: '',
  file_url: '',
  external_url: '',
  image_url: '',
  published_date: '',
  order: 0,
  is_active: true,
};

const TYPE_OPTIONS = [
  { value: 'journal', label: 'Журнал' },
  { value: 'article', label: 'Статья' },
  { value: 'book', label: 'Книга' },
];

const TYPE_LABELS = {
  journal: 'Журнал',
  article: 'Статья',
  book: 'Книга',
};

const TYPE_COLORS = {
  journal: 'bg-blue-50 text-blue-700',
  article: 'bg-amber-50 text-amber-700',
  book: 'bg-purple-50 text-purple-700',
};

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'journal', label: 'Журналы', icon: Newspaper },
  { key: 'article', label: 'Статьи', icon: FileText },
  { key: 'book', label: 'Книги', icon: BookMarked },
];

const columns = [
  {
    key: 'title_ru',
    label: 'Название (RU)',
    render: (val) => (
      <span className="font-medium text-slate-800">{val || '—'}</span>
    ),
  },
  {
    key: 'author_name_ru',
    label: 'Автор',
    render: (val) => <span className="text-slate-600">{val || '—'}</span>,
  },
  {
    key: 'resource_type',
    label: 'Тип',
    width: 'w-28',
    render: (val) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[val] || 'bg-slate-100 text-slate-600'}`}>
        {TYPE_LABELS[val] || val}
      </span>
    ),
  },
  {
    key: 'published_date',
    label: 'Дата',
    width: 'w-28',
    render: (val) => <span className="text-slate-500">{val || '—'}</span>,
  },
  {
    key: 'is_active',
    label: 'Статус',
    width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
];

const MediaResourcesAdmin = () => {
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getMediaResources(true);
      setResources(res.data);
    } catch {
      toast.error('Ошибка загрузки медиаресурсов');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = activeFilter === 'all'
    ? resources
    : resources.filter(r => r.resource_type === activeFilter);

  const handleCreate = () => {
    setEditModal({
      ...EMPTY_RESOURCE,
      resource_type: activeFilter !== 'all' ? activeFilter : 'journal',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateMediaResource(editModal.id, editModal);
        toast.success('Ресурс обновлён');
      } else {
        await contentAPI.createMediaResource(editModal);
        toast.success('Ресурс добавлен');
      }
      setEditModal(null);
      await loadData();
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteMediaResource(deleteTarget.id);
      setResources(resources.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Ресурс удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) {
      setEditModal({ ...editModal, image_url: '' });
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, image_url: res.data.url });
      toast.success('Обложка загружена');
    } catch {
      toast.error('Ошибка загрузки изображения');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setEditModal({ ...editModal, file_url: '' });
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, file_url: res.data.url });
      toast.success('Файл загружен');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  if (loading) return <Skeleton rows={6} cols={5} />;

  return (
    <div>
      <PageHeader
        title="Медиаресурсы"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Медиаресурсы' },
        ]}
        action={
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-0.5 mb-4 bg-slate-100 rounded-md p-0.5 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeFilter === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-slate-400">
              ({tab.key === 'all'
                ? resources.length
                : resources.filter(r => r.resource_type === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        data={filteredResources}
        loading={loading}
        onEdit={(row) => setEditModal({ ...row })}
        onDelete={setDeleteTarget}
        emptyIcon={BookOpen}
        emptyTitle="Ресурсов пока нет"
        emptyDescription="Добавьте первый медиаресурс"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать ресурс' : 'Добавить ресурс'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Resource type */}
            <AdminFormField
              label="Тип ресурса"
              name="resource_type"
              type="select"
              value={editModal.resource_type}
              onChange={(e) => updateField('resource_type', e.target.value)}
              options={TYPE_OPTIONS}
            />

            {/* Title */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Название (${lang.toUpperCase()})`}
                  name={`title_${lang}`}
                  value={editModal[`title_${lang}`]}
                  onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Название ресурса"
                />
              )}
            </LangTabs>

            {/* Description */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Описание (${lang.toUpperCase()})`}
                  name={`description_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`description_${lang}`]}
                  onChange={(e) => updateField(`description_${lang}`, e.target.value)}
                  placeholder="Краткое описание ресурса"
                />
              )}
            </LangTabs>

            {/* Author */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Автор (${lang.toUpperCase()})`}
                  name={`author_name_${lang}`}
                  value={editModal[`author_name_${lang}`]}
                  onChange={(e) => updateField(`author_name_${lang}`, e.target.value)}
                  placeholder="Имя автора"
                />
              )}
            </LangTabs>

            {/* Cover image upload */}
            <FileUpload
              label="Обложка"
              value={editModal.image_url}
              onChange={handleImageUpload}
              accept="image/*"
            />

            {/* PDF file upload */}
            <FileUpload
              label="Файл документа (PDF)"
              value={editModal.file_url}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              preview
            />

            {/* External URL */}
            <AdminFormField
              label="Внешняя ссылка"
              name="external_url"
              type="url"
              value={editModal.external_url}
              onChange={(e) => updateField('external_url', e.target.value)}
              placeholder="https://example.com/article"
            />

            {/* Published date */}
            <AdminFormField
              label="Дата публикации"
              name="published_date"
              type="date"
              value={editModal.published_date}
              onChange={(e) => updateField('published_date', e.target.value)}
              className="w-48"
            />

            {/* Order & Active */}
            <div className="flex items-end gap-6">
              <AdminFormField
                label="Порядок сортировки"
                name="order"
                type="number"
                value={editModal.order}
                onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                className="w-28"
              />
              <AdminFormField
                label="Активен"
                name="is_active"
                type="checkbox"
                value={editModal.is_active}
                onChange={(e) => updateField('is_active', e.target.value)}
              />
            </div>
          </AdminForm>
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить ресурс?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.title_ru}"? Прикреплённые файлы также будут удалены.`}
        loading={deleting}
      />
    </div>
  );
};

export default MediaResourcesAdmin;
