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
  useToast,
} from '../../components/admin';

const EMPTY_MEMBER = {
  last_name_ru: '', last_name_uz: '', last_name_en: '',
  first_name_ru: '', first_name_uz: '', first_name_en: '',
  patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
  position_ru: '', position_uz: '', position_en: '',
  degree_ru: '', degree_uz: '', degree_en: '',
  workplace_ru: '', workplace_uz: '', workplace_en: '',
  bio_ru: '', bio_uz: '', bio_en: '',
  achievements_ru: '', achievements_uz: '', achievements_en: '',
  photo_url: '', email: '', phone: '',
  order: 0, is_active: true,
};

const LABELS = {
  ru: {
    last_name: 'Фамилия', first_name: 'Имя', patronymic: 'Отчество',
    position: 'Должность', degree: 'Учёная степень', workplace: 'Место работы',
    bio: 'Биография', achievements: 'Достижения',
  },
  uz: {
    last_name: 'Familiya', first_name: 'Ism', patronymic: 'Otasining ismi',
    position: 'Lavozim', degree: 'Ilmiy daraja', workplace: 'Ish joyi',
    bio: 'Biografiya', achievements: 'Yutuqlar',
  },
  en: {
    last_name: 'Last Name', first_name: 'First Name', patronymic: 'Patronymic',
    position: 'Position', degree: 'Degree', workplace: 'Workplace',
    bio: 'Biography', achievements: 'Achievements',
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
            <Users className="w-4 h-4 text-slate-300" />
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
  { key: 'position_ru', label: 'Должность' },
  { key: 'degree_ru', label: 'Степень' },
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

const BoardMembersAdmin = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await contentAPI.getBoardMembers(true);
      setMembers(res.data);
    } catch {
      toast.error('Ошибка загрузки членов правления');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateBoardMember(editModal.id, editModal);
        toast.success('Член правления обновлён');
      } else {
        await contentAPI.createBoardMember(editModal);
        toast.success('Член правления добавлен');
      }
      await loadMembers();
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
      await contentAPI.deleteBoardMember(deleteTarget.id);
      setMembers(members.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Член правления удалён');
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
    } catch {
      toast.error('Ошибка загрузки фото');
    }
  };

  const updateField = (field, value) => {
    setEditModal({ ...editModal, [field]: value });
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      <PageHeader
        title="Члены правления"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Члены правления' },
        ]}
        action={
          <button
            onClick={() => setEditModal({ ...EMPTY_MEMBER })}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={members}
        loading={loading}
        onEdit={(row) => setEditModal({ ...row })}
        onDelete={(row) => setDeleteTarget(row)}
        emptyIcon={<Users className="w-10 h-10" />}
        emptyTitle="Членов правления пока нет"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать члена правления' : 'Добавить члена правления'}
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
                    placeholder={lang === 'ru' ? 'Иванов' : lang === 'uz' ? 'Ivanov' : 'Ivanov'}
                  />
                  <AdminFormField
                    label={LABELS[lang].first_name}
                    name={`first_name_${lang}`}
                    value={editModal[`first_name_${lang}`]}
                    onChange={(e) => updateField(`first_name_${lang}`, e.target.value)}
                    required={lang === 'ru'}
                    placeholder={lang === 'ru' ? 'Иван' : lang === 'uz' ? 'Ivan' : 'Ivan'}
                  />
                  <AdminFormField
                    label={LABELS[lang].patronymic}
                    name={`patronymic_${lang}`}
                    value={editModal[`patronymic_${lang}`]}
                    onChange={(e) => updateField(`patronymic_${lang}`, e.target.value)}
                    placeholder={lang === 'ru' ? 'Иванович' : 'Ivanovich'}
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
                  placeholder={lang === 'ru' ? 'Председатель' : lang === 'uz' ? 'Rais' : 'Chairman'}
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
                  placeholder={
                    lang === 'ru' ? 'Доктор мед. наук, профессор'
                    : lang === 'uz' ? 'Tibbiyot fanlari doktori'
                    : 'Doctor of Medical Sciences'
                  }
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
                  rows={4}
                  value={editModal[`bio_${lang}`]}
                  onChange={(e) => updateField(`bio_${lang}`, e.target.value)}
                  placeholder={
                    lang === 'ru' ? 'Образование, карьерный путь, специализация...'
                    : lang === 'uz' ? 'Batafsil biografiya...'
                    : 'Education, career path, specialization...'
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
                    lang === 'ru' ? 'Награды, почётные звания, публикации...'
                    : lang === 'uz' ? 'Mukofotlar, faxriy unvonlar...'
                    : 'Awards, honors, publications...'
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
        title="Удалить члена правления?"
        message={`Вы уверены, что хотите удалить ${deleteTarget?.last_name_ru} ${deleteTarget?.first_name_ru}?`}
        loading={deleting}
      />
    </div>
  );
};

export default BoardMembersAdmin;
