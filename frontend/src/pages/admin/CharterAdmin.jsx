import { useState, useEffect } from 'react';
import { Plus, FileText, Download } from 'lucide-react';
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
  description_ru: '', description_uz: '', description_en: '',
  file_url: '',
  version: '',
  is_active: true,
};

const columns = [
  {
    key: 'title_ru',
    label: 'Название (RU)',
    sortable: true,
    render: (val, row) => (
      <div>
        <span className="font-medium text-slate-800">{val || '—'}</span>
        {row.version && (
          <span className="ml-1.5 text-xs text-slate-400">v{row.version}</span>
        )}
      </div>
    ),
  },
  {
    key: 'version',
    label: 'Версия',
    sortable: true,
    width: 'w-24',
    render: (val) => (
      <span className="text-slate-600">{val ? `v${val}` : '—'}</span>
    ),
  },
  {
    key: 'file_url',
    label: 'Файл',
    sortable: false,
    width: 'w-32',
    render: (val) =>
      val ? (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
        >
          <Download className="w-3 h-3" />
          Скачать PDF
        </a>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    key: 'is_active',
    label: 'Статус',
    sortable: true,
    width: 'w-32',
    render: (val) => (
      <StatusBadge active={val} activeText="Активная версия" inactiveText="Неактивен" />
    ),
  },
];

const CharterAdmin = () => {
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
      const res = await contentAPI.getCharters();
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
        await contentAPI.updateCharter(editModal.id, editModal);
      } else {
        await contentAPI.createCharter(editModal);
      }
      toast.success(editModal.id ? 'Устав обновлён' : 'Устав добавлен');
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
      await contentAPI.deleteCharter(deleteTarget.id);
      setItems(items.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Устав удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
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

  if (loading) return <Skeleton rows={4} cols={4} />;

  return (
    <div>
      <PageHeader
        title="Устав"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Устав' },
        ]}
        action={
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить версию
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyIcon={FileText}
        emptyTitle="Устав ещё не добавлен"
        emptyDescription="Добавьте первую версию устава Ассоциации"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать устав' : 'Добавить устав'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* PDF file upload */}
            <FileUpload
              label="Файл (PDF)"
              value={editModal.file_url}
              onChange={handleFileUpload}
              accept=".pdf"
            />

            {/* Title fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Название (${lang.toUpperCase()})`}
                  name={`title_${lang}`}
                  value={editModal[`title_${lang}`]}
                  onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Устав Ассоциации"
                />
              )}
            </LangTabs>

            {/* Description fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Описание (${lang.toUpperCase()})`}
                  name={`description_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`description_${lang}`]}
                  onChange={(e) => updateField(`description_${lang}`, e.target.value)}
                  placeholder="Краткое описание версии устава"
                />
              )}
            </LangTabs>

            {/* Version & Active */}
            <div className="flex items-end gap-6">
              <AdminFormField
                label="Версия"
                name="version"
                value={editModal.version}
                onChange={(e) => updateField('version', e.target.value)}
                placeholder="1.0"
                className="w-32"
              />
              <AdminFormField
                label="Активная версия (отображается на сайте)"
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
        title="Удалить устав?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.title_ru}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default CharterAdmin;
