import { useState, useEffect } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
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

const EMPTY_DOCTOR = {
  last_name_ru: '', last_name_uz: '', last_name_en: '',
  first_name_ru: '', first_name_uz: '', first_name_en: '',
  patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
  position_ru: '', position_uz: '', position_en: '',
  degree_ru: '', degree_uz: '', degree_en: '',
  workplace_ru: '', workplace_uz: '', workplace_en: '',
  region_ru: '', region_uz: '', region_en: '',
  bio_ru: '', bio_uz: '', bio_en: '',
  achievements_ru: '', achievements_uz: '', achievements_en: '',
  photo_url: '', email: '', phone: '',
  order: 0, is_active: true,
};

const LABELS = {
  ru: {
    last_name: 'Фамилия', first_name: 'Имя', patronymic: 'Отчество',
    position: 'Должность', degree: 'Учёная степень', workplace: 'Место работы',
    region: 'Регион', bio: 'Биография', achievements: 'Достижения',
  },
  uz: {
    last_name: 'Familiya', first_name: 'Ism', patronymic: 'Otasining ismi',
    position: 'Lavozim', degree: 'Ilmiy daraja', workplace: 'Ish joyi',
    region: 'Hudud', bio: 'Biografiya', achievements: 'Yutuqlar',
  },
  en: {
    last_name: 'Last Name', first_name: 'First Name', patronymic: 'Patronymic',
    position: 'Position', degree: 'Degree', workplace: 'Workplace',
    region: 'Region', bio: 'Biography', achievements: 'Achievements',
  },
};

const columns = [
  {
    key: 'photo_url',
    label: 'Фото',
    sortable: false,
    width: 'w-16',
    render: (val) => (
      <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
        {val ? (
          <img src={val} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-slate-300" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'last_name_ru',
    label: 'ФИО',
    render: (_, row) => (
      <span className="font-medium text-slate-800">
        {row.last_name_ru} {row.first_name_ru} {row.patronymic_ru}
      </span>
    ),
  },
  {
    key: 'region_ru',
    label: 'Регион',
    render: (val) => <span className="text-blue-600 text-xs font-medium">{val}</span>,
  },
  { key: 'position_ru', label: 'Должность' },
  {
    key: 'order',
    label: '#',
    width: 'w-12',
  },
  {
    key: 'is_active',
    label: 'Статус',
    width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
];

const ChiefRheumatologistsAdmin = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await contentAPI.getChiefRheumatologists(true);
      setDoctors(res.data);
    } catch {
      toast.error('Ошибка загрузки главных ревматологов');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateChiefRheumatologist(editModal.id, editModal);
        toast.success('Ревматолог обновлён');
      } else {
        await contentAPI.createChiefRheumatologist(editModal);
        toast.success('Ревматолог добавлен');
      }
      await loadDoctors();
      setEditModal(null);
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteChiefRheumatologist(deleteTarget.id);
      setDoctors(doctors.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Ревматолог удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, photo_url: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, photo_url: res.data.url }));
    } catch {
      toast.error('Ошибка загрузки фото');
    }
  };

  const updateField = (field, value) => {
    setEditModal(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      <PageHeader
        title="Главные ревматологи"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Главные ревматологи' },
        ]}
        action={
          <button
            onClick={() => setEditModal({ ...EMPTY_DOCTOR })}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={doctors}
        loading={loading}
        onEdit={(row) => setEditModal({ ...row })}
        onDelete={(row) => setDeleteTarget(row)}
        emptyIcon={<Stethoscope className="w-10 h-10" />}
        emptyTitle="Главных ревматологов пока нет"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать ревматолога' : 'Добавить ревматолога'}
        size="lg"
      >
        {editModal && (
          <AdminForm onSubmit={handleSave} loading={saving} onCancel={() => setEditModal(null)}>
            {/* Photo */}
            <FileUpload
              value={editModal.photo_url}
              onChange={handlePhotoUpload}
              accept="image/*"
              label="Фото"
            />

            {/* Region */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].region}
                  name={`region_${lang}`}
                  value={editModal[`region_${lang}`]}
                  onChange={(e) => updateField(`region_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder={
                    lang === 'ru' ? 'г. Ташкент'
                    : lang === 'uz' ? 'Toshkent sh.'
                    : 'Tashkent City'
                  }
                />
              )}
            </LangTabs>

            {/* Name fields */}
            <LangTabs>
              {(lang) => (
                <div className="grid grid-cols-3 gap-3">
                  <AdminFormField
                    label={LABELS[lang].last_name}
                    name={`last_name_${lang}`}
                    value={editModal[`last_name_${lang}`]}
                    onChange={(e) => updateField(`last_name_${lang}`, e.target.value)}
                    required={lang === 'ru'}
                  />
                  <AdminFormField
                    label={LABELS[lang].first_name}
                    name={`first_name_${lang}`}
                    value={editModal[`first_name_${lang}`]}
                    onChange={(e) => updateField(`first_name_${lang}`, e.target.value)}
                    required={lang === 'ru'}
                  />
                  <AdminFormField
                    label={LABELS[lang].patronymic}
                    name={`patronymic_${lang}`}
                    value={editModal[`patronymic_${lang}`]}
                    onChange={(e) => updateField(`patronymic_${lang}`, e.target.value)}
                  />
                </div>
              )}
            </LangTabs>

            {/* Position */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].position}
                  name={`position_${lang}`}
                  value={editModal[`position_${lang}`]}
                  onChange={(e) => updateField(`position_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder={
                    lang === 'ru' ? 'Главный ревматолог'
                    : lang === 'uz' ? 'Bosh revmatolog'
                    : 'Chief Rheumatologist'
                  }
                />
              )}
            </LangTabs>

            {/* Degree */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].degree}
                  name={`degree_${lang}`}
                  value={editModal[`degree_${lang}`]}
                  onChange={(e) => updateField(`degree_${lang}`, e.target.value)}
                />
              )}
            </LangTabs>

            {/* Workplace */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].workplace}
                  name={`workplace_${lang}`}
                  type="textarea"
                  rows={2}
                  value={editModal[`workplace_${lang}`]}
                  onChange={(e) => updateField(`workplace_${lang}`, e.target.value)}
                />
              )}
            </LangTabs>

            {/* Bio */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].bio}
                  name={`bio_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`bio_${lang}`]}
                  onChange={(e) => updateField(`bio_${lang}`, e.target.value)}
                  placeholder={
                    lang === 'ru' ? 'Краткая биография...'
                    : lang === 'uz' ? 'Qisqa tarjimai hol...'
                    : 'Brief biography...'
                  }
                />
              )}
            </LangTabs>

            {/* Achievements */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={LABELS[lang].achievements}
                  name={`achievements_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`achievements_${lang}`]}
                  onChange={(e) => updateField(`achievements_${lang}`, e.target.value)}
                  placeholder={
                    lang === 'ru' ? 'Достижения, награды, публикации...'
                    : lang === 'uz' ? 'Yutuqlar, mukofotlar, nashrlar...'
                    : 'Achievements, awards, publications...'
                  }
                />
              )}
            </LangTabs>

            {/* Contact & Order */}
            <div className="grid grid-cols-3 gap-3">
              <AdminFormField
                label="Email"
                name="email"
                type="email"
                value={editModal.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <AdminFormField
                label="Телефон"
                name="phone"
                type="tel"
                value={editModal.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <AdminFormField
                label="Порядок сортировки"
                name="order"
                type="number"
                value={editModal.order}
                onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Active */}
            <AdminFormField
              label="Активен (отображается на сайте)"
              name="is_active"
              type="checkbox"
              value={editModal.is_active}
              onChange={(e) => updateField('is_active', e.target.value)}
            />
          </AdminForm>
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить ревматолога?"
        message={`Вы уверены, что хотите удалить ${deleteTarget?.last_name_ru} ${deleteTarget?.first_name_ru}?`}
        loading={deleting}
      />
    </div>
  );
};

export default ChiefRheumatologistsAdmin;
