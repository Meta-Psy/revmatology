import { useState, useEffect } from 'react';
import { Plus, History } from 'lucide-react';
import { contentAPI } from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import AdminForm from '../../components/admin/AdminForm';
import AdminFormField from '../../components/admin/AdminFormField';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import LangTabs from '../../components/admin/LangTabs';
import FileUpload from '../../components/admin/FileUpload';
import StatusBadge from '../../components/admin/StatusBadge';
import Skeleton from '../../components/admin/Skeleton';
import { useToast } from '../../components/admin/Toast';

const EMPTY_ITEM = {
  title_ru: '', title_uz: '', title_en: '',
  content_ru: '', content_uz: '', content_en: '',
  image_url: '',
  year: null,
  order: 0,
  is_active: true,
};

const columns = [
  {
    key: 'year',
    label: 'Год',
    sortable: true,
    width: 'w-24',
    render: (val) => (
      <span className="font-medium text-slate-800">{val || '—'}</span>
    ),
  },
  {
    key: 'title_ru',
    label: 'Название (RU)',
    sortable: true,
    render: (val) => (
      <span className="font-medium text-slate-800 line-clamp-1">{val || '—'}</span>
    ),
  },
  {
    key: 'is_active',
    label: 'Статус',
    sortable: true,
    width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
  {
    key: 'order',
    label: 'Порядок',
    sortable: true,
    width: 'w-24',
    render: (val) => <span className="text-slate-500">{val ?? 0}</span>,
  },
];

const HistoryAdmin = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await contentAPI.getHistory(true);
      setItems(res.data);
    } catch {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => setEditModal({ ...row });
  const handleCreate = () => setEditModal({ ...EMPTY_ITEM });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateHistory(editModal.id, editModal);
      } else {
        await contentAPI.createHistory(editModal);
      }
      toast.success(editModal.id ? 'Запись обновлена' : 'Запись создана');
      setEditModal(null);
      await loadItems();
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteHistory(deleteTarget.id);
      setItems(items.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Запись удалена');
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
      toast.success('Изображение загружено');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  if (loading) return <Skeleton rows={6} cols={4} />;

  return (
    <div>
      <PageHeader
        title="История Ассоциации"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'История' },
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

      <AdminTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyIcon={History}
        emptyTitle="Записей истории пока нет"
        emptyDescription="Добавьте первую запись об истории Ассоциации"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать запись' : 'Добавить запись'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Title fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Заголовок (${lang.toUpperCase()})`}
                  name={`title_${lang}`}
                  value={editModal[`title_${lang}`]}
                  onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Заголовок записи"
                />
              )}
            </LangTabs>

            {/* Content fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Контент (${lang.toUpperCase()}) — поддерживается HTML`}
                  name={`content_${lang}`}
                  type="textarea"
                  rows={6}
                  value={editModal[`content_${lang}`]}
                  onChange={(e) => updateField(`content_${lang}`, e.target.value)}
                  placeholder="<p>Описание события...</p>"
                />
              )}
            </LangTabs>

            {/* Year */}
            <AdminFormField
              label="Год"
              name="year"
              type="number"
              value={editModal.year || ''}
              onChange={(e) => updateField('year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="2005"
              className="max-w-[160px]"
            />

            {/* Image */}
            <FileUpload
              label="Изображение"
              value={editModal.image_url}
              onChange={handleImageUpload}
              accept="image/*"
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
        title="Удалить запись?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.title_ru}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default HistoryAdmin;
