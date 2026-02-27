import { useState, useEffect } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
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
  event_type: 'masterclass',
  title_ru: '', title_uz: '', title_en: '',
  description_ru: '', description_uz: '', description_en: '',
  program_ru: '', program_uz: '', program_en: '',
  location_ru: '', location_uz: '', location_en: '',
  speaker_ru: '', speaker_uz: '', speaker_en: '',
  date_start: '', date_end: '',
  image_url: '',
  registration_url: '',
  registration_open: true,
  order: 0,
  is_active: true,
};

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'masterclass', label: 'Мастерклассы' },
  { key: 'webinar', label: 'Вебинары' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const columns = [
  {
    key: 'title_ru',
    label: 'Название (RU)',
    sortable: true,
    render: (val) => (
      <span className="font-medium text-slate-800">{val || '---'}</span>
    ),
  },
  {
    key: 'event_type',
    label: 'Тип',
    sortable: true,
    width: 'w-32',
    render: (val) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        val === 'webinar'
          ? 'bg-indigo-50 text-indigo-700'
          : 'bg-teal-50 text-teal-700'
      }`}>
        {val === 'webinar' ? 'Вебинар' : 'Мастеркласс'}
      </span>
    ),
  },
  {
    key: 'date_start',
    label: 'Дата',
    sortable: true,
    width: 'w-40',
    render: (val) => (
      <span className="text-slate-500 text-xs">{formatDate(val)}</span>
    ),
  },
  {
    key: 'location_ru',
    label: 'Место',
    sortable: true,
    width: 'w-36',
    render: (val) => (
      <span className="text-slate-600 text-xs truncate max-w-[130px] inline-block">{val || '---'}</span>
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

const EducationEventsAdmin = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await contentAPI.getEducationEvents(true);
      setItems(res.data);
    } catch {
      toast.error('Ошибка загрузки мероприятий');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter((e) => e.event_type === filter);

  const handleEdit = (row) => setEditModal({ ...row });
  const handleCreate = () => setEditModal({ ...EMPTY_ITEM, event_type: filter === 'all' ? 'masterclass' : filter });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateEducationEvent(editModal.id, editModal);
      } else {
        await contentAPI.createEducationEvent(editModal);
      }
      toast.success(editModal.id ? 'Мероприятие обновлено' : 'Мероприятие добавлено');
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
      await contentAPI.deleteEducationEvent(deleteTarget.id);
      setItems(items.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Мероприятие удалено');
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

  if (loading) return <Skeleton rows={6} cols={5} />;

  return (
    <div>
      <PageHeader
        title="Образовательные мероприятия"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Образование' },
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
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filter === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        data={filteredItems}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyIcon={GraduationCap}
        emptyTitle={
          filter === 'webinar'
            ? 'Вебинаров пока нет'
            : filter === 'masterclass'
              ? 'Мастерклассов пока нет'
              : 'Мероприятий пока нет'
        }
        emptyDescription="Нажмите кнопку выше, чтобы добавить"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id
          ? `Редактировать ${editModal.event_type === 'masterclass' ? 'мастеркласс' : 'вебинар'}`
          : `Добавить ${editModal?.event_type === 'masterclass' ? 'мастеркласс' : 'вебинар'}`
        }
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Type select */}
            <AdminFormField
              label="Тип мероприятия"
              name="event_type"
              type="select"
              value={editModal.event_type}
              onChange={(e) => updateField('event_type', e.target.value)}
              options={[
                { value: 'masterclass', label: 'Мастеркласс' },
                { value: 'webinar', label: 'Вебинар' },
              ]}
              className="w-48"
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
                  placeholder="Название мероприятия"
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
                  placeholder="Описание мероприятия"
                />
              )}
            </LangTabs>

            {/* Program */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Программа (${lang.toUpperCase()})`}
                  name={`program_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`program_${lang}`]}
                  onChange={(e) => updateField(`program_${lang}`, e.target.value)}
                  placeholder="Программа мероприятия"
                />
              )}
            </LangTabs>

            {/* Speaker */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Спикер (${lang.toUpperCase()})`}
                  name={`speaker_${lang}`}
                  value={editModal[`speaker_${lang}`]}
                  onChange={(e) => updateField(`speaker_${lang}`, e.target.value)}
                  placeholder="ФИО спикера"
                />
              )}
            </LangTabs>

            {/* Location */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Место проведения (${lang.toUpperCase()})`}
                  name={`location_${lang}`}
                  value={editModal[`location_${lang}`]}
                  onChange={(e) => updateField(`location_${lang}`, e.target.value)}
                  placeholder="Адрес или ссылка"
                />
              )}
            </LangTabs>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <AdminFormField
                label="Дата начала"
                name="date_start"
                type="datetime-local"
                value={editModal.date_start}
                onChange={(e) => updateField('date_start', e.target.value)}
                required
              />
              <AdminFormField
                label="Дата окончания"
                name="date_end"
                type="datetime-local"
                value={editModal.date_end}
                onChange={(e) => updateField('date_end', e.target.value)}
              />
            </div>

            {/* Image */}
            <FileUpload
              label="Изображение"
              value={editModal.image_url}
              onChange={handleImageUpload}
              accept="image/*"
            />

            {/* Registration URL */}
            <AdminFormField
              label="Ссылка на регистрацию"
              name="registration_url"
              type="url"
              value={editModal.registration_url}
              onChange={(e) => updateField('registration_url', e.target.value)}
              placeholder="https://..."
            />

            {/* Order & Checkboxes */}
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
                label="Регистрация открыта"
                name="registration_open"
                type="checkbox"
                value={editModal.registration_open}
                onChange={(e) => updateField('registration_open', e.target.value)}
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
        title="Удалить мероприятие?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.title_ru}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default EducationEventsAdmin;
