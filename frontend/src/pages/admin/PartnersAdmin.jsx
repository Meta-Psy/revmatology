import { useState, useEffect } from 'react';
import { Plus, Handshake, ExternalLink } from 'lucide-react';
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
  name_ru: '', name_uz: '', name_en: '',
  short_name: '',
  description_ru: '', description_uz: '', description_en: '',
  logo_url: '',
  website_url: '',
  country_ru: '', country_uz: '', country_en: '',
  order: 0,
  is_active: true,
};

const columns = [
  {
    key: 'logo_url',
    label: 'Лого',
    sortable: false,
    width: 'w-16',
    render: (val, row) => (
      <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
        {val ? (
          <img src={val} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-xs font-bold text-slate-400">{row.short_name || '?'}</span>
        )}
      </div>
    ),
  },
  {
    key: 'name_ru',
    label: 'Название (RU)',
    sortable: true,
    render: (val, row) => (
      <div>
        <span className="font-medium text-slate-800">{val || '—'}</span>
        {row.short_name && (
          <span className="ml-1.5 text-xs text-slate-400">({row.short_name})</span>
        )}
      </div>
    ),
  },
  {
    key: 'country_ru',
    label: 'Страна',
    sortable: true,
    width: 'w-32',
    render: (val) => <span className="text-slate-600">{val || '—'}</span>,
  },
  {
    key: 'website_url',
    label: 'Веб-сайт',
    sortable: false,
    width: 'w-40',
    render: (val) =>
      val ? (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs truncate max-w-[140px]"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{val.replace(/^https?:\/\/(www\.)?/, '')}</span>
        </a>
      ) : (
        <span className="text-slate-400">—</span>
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

const PartnersAdmin = () => {
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
      const res = await contentAPI.getPartners(true);
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
        await contentAPI.updatePartner(editModal.id, editModal);
      } else {
        await contentAPI.createPartner(editModal);
      }
      toast.success(editModal.id ? 'Партнёр обновлён' : 'Партнёр добавлен');
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
      await contentAPI.deletePartner(deleteTarget.id);
      setItems(items.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Партнёр удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, logo_url: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, logo_url: res.data.url }));
      toast.success('Логотип загружен');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Skeleton rows={6} cols={6} />;

  return (
    <div>
      <PageHeader
        title="Международные партнёры"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Партнёры' },
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
        emptyIcon={Handshake}
        emptyTitle="Партнёров пока нет"
        emptyDescription="Добавьте первого международного партнёра"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать партнёра' : 'Добавить партнёра'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Logo */}
            <FileUpload
              label="Логотип"
              value={editModal.logo_url}
              onChange={handleLogoUpload}
              accept="image/*"
            />

            {/* Name fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Название (${lang.toUpperCase()})`}
                  name={`name_${lang}`}
                  value={editModal[`name_${lang}`]}
                  onChange={(e) => updateField(`name_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Полное название организации"
                />
              )}
            </LangTabs>

            {/* Short name & Website */}
            <div className="grid grid-cols-2 gap-4">
              <AdminFormField
                label="Краткое название"
                name="short_name"
                value={editModal.short_name}
                onChange={(e) => updateField('short_name', e.target.value)}
                placeholder="EULAR"
              />
              <AdminFormField
                label="Веб-сайт"
                name="website_url"
                type="url"
                value={editModal.website_url}
                onChange={(e) => updateField('website_url', e.target.value)}
                placeholder="https://www.example.org"
              />
            </div>

            {/* Country fields with language tabs */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Страна/регион (${lang.toUpperCase()})`}
                  name={`country_${lang}`}
                  value={editModal[`country_${lang}`]}
                  onChange={(e) => updateField(`country_${lang}`, e.target.value)}
                  placeholder="Страна или регион"
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
                  placeholder="Краткое описание организации"
                />
              )}
            </LangTabs>

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
        title="Удалить партнёра?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.name_ru}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default PartnersAdmin;
