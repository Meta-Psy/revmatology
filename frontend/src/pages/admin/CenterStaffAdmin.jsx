import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
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

const EMPTY_STAFF = {
  center_id: '',
  last_name_ru: '', last_name_uz: '', last_name_en: '',
  first_name_ru: '', first_name_uz: '', first_name_en: '',
  patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
  position_ru: '', position_uz: '', position_en: '',
  credentials_ru: '', credentials_uz: '', credentials_en: '',
  photo_url: '',
  order: 0,
  is_active: true,
};

const CenterStaffAdmin = () => {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCenters();
  }, []);

  useEffect(() => {
    loadStaff();
  }, [selectedCenterId]);

  const loadCenters = async () => {
    try {
      const res = await contentAPI.getCenters(true);
      setCenters(res.data);
    } catch {
      toast.error('Ошибка загрузки центров');
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const centerId = selectedCenterId || null;
      const res = await contentAPI.getCenterStaff(centerId, true);
      setStaff(res.data);
    } catch {
      toast.error('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const getCenterName = (centerId) => {
    const center = centers.find((c) => c.id === centerId);
    return center ? center.name_ru : '\u2014';
  };

  const centerOptions = [
    { value: '', label: 'Выберите центр' },
    ...centers.map((c) => ({ value: c.id, label: c.name_ru })),
  ];

  const filterOptions = [
    { value: '', label: 'Все центры' },
    ...centers.map((c) => ({ value: c.id, label: c.name_ru })),
  ];

  const columns = [
    {
      key: 'photo_url',
      label: 'Фото',
      sortable: false,
      width: 'w-16',
      render: (val) =>
        val ? (
          <img src={val} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        ),
    },
    {
      key: 'last_name_ru',
      label: 'ФИО (RU)',
      sortable: true,
      render: (_val, row) => (
        <span className="font-medium text-slate-800 line-clamp-1">
          {row.last_name_ru} {row.first_name_ru} {row.patronymic_ru}
        </span>
      ),
    },
    {
      key: 'position_ru',
      label: 'Должность',
      sortable: true,
      render: (val) => (
        <span className="text-slate-600 line-clamp-1">{val || '\u2014'}</span>
      ),
    },
    {
      key: 'center_id',
      label: 'Центр',
      sortable: false,
      render: (val) => (
        <span className="text-xs text-blue-600">{getCenterName(val)}</span>
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

  const handleEdit = (row) => setEditModal({ ...row });

  const handleCreate = () => {
    const newStaff = { ...EMPTY_STAFF };
    if (selectedCenterId) {
      newStaff.center_id = parseInt(selectedCenterId);
    }
    setEditModal(newStaff);
  };

  const handleSave = async () => {
    if (!editModal.center_id) {
      toast.error('Выберите центр');
      return;
    }
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateStaffMember(editModal.id, editModal);
      } else {
        await contentAPI.createStaffMember(editModal);
      }
      toast.success(editModal.id ? 'Сотрудник обновлён' : 'Сотрудник добавлен');
      setEditModal(null);
      await loadStaff();
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteStaffMember(deleteTarget.id);
      setStaff(staff.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Сотрудник удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) {
      setEditModal({ ...editModal, photo_url: '' });
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal({ ...editModal, photo_url: res.data.url });
      toast.success('Фото загружено');
    } catch {
      toast.error('Ошибка загрузки фото');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  if (loading && centers.length === 0) return <Skeleton rows={6} cols={5} />;

  return (
    <div>
      <PageHeader
        title="Сотрудники центров"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Сотрудники' },
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

      {/* Filter by Center */}
      <div className="mb-4">
        <AdminFormField
          label="Фильтр по центру"
          name="center_filter"
          type="select"
          value={selectedCenterId}
          onChange={(e) => setSelectedCenterId(e.target.value)}
          options={filterOptions}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <Skeleton rows={6} cols={5} />
      ) : (
        <AdminTable
          columns={columns}
          data={staff}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          emptyIcon={Users}
          emptyTitle={selectedCenterId ? 'В этом центре нет сотрудников' : 'Сотрудников пока нет'}
          emptyDescription="Добавьте первого сотрудника"
        />
      )}

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Center Selection */}
            <AdminFormField
              label="Центр"
              name="center_id"
              type="select"
              value={editModal.center_id}
              onChange={(e) => updateField('center_id', parseInt(e.target.value))}
              options={centerOptions}
              required
            />

            {/* Photo */}
            <FileUpload
              label="Фото"
              value={editModal.photo_url}
              onChange={handlePhotoUpload}
              accept="image/*"
            />

            {/* Last Name */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Фамилия (${lang.toUpperCase()})`}
                  name={`last_name_${lang}`}
                  value={editModal[`last_name_${lang}`]}
                  onChange={(e) => updateField(`last_name_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                />
              )}
            </LangTabs>

            {/* First Name */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Имя (${lang.toUpperCase()})`}
                  name={`first_name_${lang}`}
                  value={editModal[`first_name_${lang}`]}
                  onChange={(e) => updateField(`first_name_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                />
              )}
            </LangTabs>

            {/* Patronymic */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Отчество (${lang.toUpperCase()})`}
                  name={`patronymic_${lang}`}
                  value={editModal[`patronymic_${lang}`]}
                  onChange={(e) => updateField(`patronymic_${lang}`, e.target.value)}
                />
              )}
            </LangTabs>

            {/* Position */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Должность (${lang.toUpperCase()})`}
                  name={`position_${lang}`}
                  value={editModal[`position_${lang}`]}
                  onChange={(e) => updateField(`position_${lang}`, e.target.value)}
                  placeholder={lang === 'ru' ? 'Врач-ревматолог' : ''}
                />
              )}
            </LangTabs>

            {/* Credentials */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Регалии (${lang.toUpperCase()})`}
                  name={`credentials_${lang}`}
                  value={editModal[`credentials_${lang}`]}
                  onChange={(e) => updateField(`credentials_${lang}`, e.target.value)}
                  placeholder={lang === 'ru' ? 'д.м.н., профессор' : lang === 'en' ? 'MD, PhD, Professor' : ''}
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
        title="Удалить сотрудника?"
        message={`Вы уверены, что хотите удалить ${deleteTarget?.last_name_ru} ${deleteTarget?.first_name_ru}?`}
        loading={deleting}
      />
    </div>
  );
};

export default CenterStaffAdmin;
