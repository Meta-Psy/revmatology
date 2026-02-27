import { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';
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
} from '../../components/admin';
import { useToast } from '../../components/admin/Toast';

const EMPTY_CENTER = {
  name_ru: '', name_uz: '', name_en: '',
  description_ru: '', description_uz: '', description_en: '',
  address_ru: '', address_uz: '', address_en: '',
  phone: '', email: '', website: '',
  image_url: '',
  order: 0,
  is_active: true,
};

const columns = [
  {
    key: 'name_ru',
    label: 'Название (RU)',
    sortable: true,
    render: (val) => (
      <span className="font-medium text-slate-800 line-clamp-1">{val || '\u2014'}</span>
    ),
  },
  {
    key: 'address_ru',
    label: 'Адрес',
    sortable: false,
    render: (val) => (
      <span className="text-slate-600 line-clamp-1">{val || '\u2014'}</span>
    ),
  },
  {
    key: 'phone',
    label: 'Телефон',
    sortable: false,
    width: 'w-40',
    render: (val) => (
      <span className="text-slate-500 text-xs">{val || '\u2014'}</span>
    ),
  },
  {
    key: 'is_active',
    label: 'Статус',
    sortable: true,
    width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
];

const CentersAdmin = () => {
  const toast = useToast();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      const res = await contentAPI.getCenters(true);
      setCenters(res.data);
    } catch {
      toast.error('Ошибка загрузки центров');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => setEditModal({ ...row });
  const handleCreate = () => setEditModal({ ...EMPTY_CENTER });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateCenter(editModal.id, editModal);
      } else {
        await contentAPI.createCenter(editModal);
      }
      toast.success(editModal.id ? 'Центр обновлён' : 'Центр создан');
      setEditModal(null);
      await loadCenters();
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteCenter(deleteTarget.id);
      setCenters(centers.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Центр удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, image_url: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, image_url: res.data.url }));
      toast.success('Изображение загружено');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  const updateField = (field, value) => {
    setEditModal(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Skeleton rows={6} cols={4} />;

  return (
    <div>
      <PageHeader
        title="Ревматологические центры"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Центры' },
        ]}
        action={
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить центр
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={centers}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyIcon={Building2}
        emptyTitle="Центров пока нет"
        emptyDescription="Добавьте первый ревматологический центр"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать центр' : 'Добавить центр'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Image */}
            <FileUpload
              label="Изображение"
              value={editModal.image_url}
              onChange={handleImageUpload}
              accept="image/*"
            />

            {/* Name */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Название (${lang.toUpperCase()})`}
                  name={`name_${lang}`}
                  value={editModal[`name_${lang}`]}
                  onChange={(e) => updateField(`name_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Название центра"
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
                  placeholder="Описание центра"
                />
              )}
            </LangTabs>

            {/* Address */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Адрес (${lang.toUpperCase()})`}
                  name={`address_${lang}`}
                  type="textarea"
                  rows={2}
                  value={editModal[`address_${lang}`]}
                  onChange={(e) => updateField(`address_${lang}`, e.target.value)}
                  placeholder="Адрес центра"
                />
              )}
            </LangTabs>

            {/* Contact info */}
            <div className="grid grid-cols-3 gap-4">
              <AdminFormField
                label="Телефон"
                name="phone"
                type="tel"
                value={editModal.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+998 71 123 45 67"
              />
              <AdminFormField
                label="Email"
                name="email"
                type="email"
                value={editModal.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="info@center.uz"
              />
              <AdminFormField
                label="Веб-сайт"
                name="website"
                value={editModal.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://center.uz"
              />
            </div>

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
                label="Активен (отображается на сайте)"
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
        title="Удалить центр?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.name_ru}"? Все сотрудники этого центра также будут удалены.`}
        loading={deleting}
      />
    </div>
  );
};

export default CentersAdmin;
