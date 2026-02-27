import { useState, useEffect } from 'react';
import { Plus, Stethoscope, FileText } from 'lucide-react';
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

const EMPTY_DISEASE = {
  name_ru: '', name_uz: '', name_en: '',
  short_name: '',
  description_ru: '', description_uz: '', description_en: '',
  symptoms_ru: '', symptoms_uz: '', symptoms_en: '',
  treatment_ru: '', treatment_uz: '', treatment_en: '',
  content_ru: '', content_uz: '', content_en: '',
  recommendation_file_url: '',
  protocol_file_url: '',
  order: 0,
  is_active: true,
};

const columns = [
  {
    key: 'name_ru',
    label: 'Название (RU)',
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
    key: 'short_name',
    label: 'Сокращение',
    width: 'w-28',
    render: (val) => (
      <span className="text-slate-600">{val || '—'}</span>
    ),
  },
  {
    key: 'recommendation_file_url',
    label: 'Документы',
    width: 'w-32',
    sortable: false,
    render: (_, row) => {
      const count = (row.recommendation_file_url ? 1 : 0) + (row.protocol_file_url ? 1 : 0);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
        }`}>
          <FileText className="w-3 h-3" />
          {count} из 2
        </span>
      );
    },
  },
  {
    key: 'is_active',
    label: 'Статус',
    width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
];

const DiseasesAdmin = () => {
  const toast = useToast();
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentAPI.getDiseases(true);
      setDiseases(res.data);
    } catch {
      toast.error('Ошибка загрузки заболеваний');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal.id) {
        await contentAPI.updateDisease(editModal.id, editModal);
        toast.success('Заболевание обновлено');
      } else {
        await contentAPI.createDisease(editModal);
        toast.success('Заболевание добавлено');
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
      await contentAPI.deleteDisease(deleteTarget.id);
      setDiseases(diseases.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Заболевание удалено');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleRecommendationUpload = async (file) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, recommendation_file_url: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, recommendation_file_url: res.data.url }));
      toast.success('Файл рекомендаций загружен');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  const handleProtocolUpload = async (file) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, protocol_file_url: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, protocol_file_url: res.data.url }));
      toast.success('Файл протокола загружен');
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
        title="Информация о заболеваниях"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Заболевания' },
        ]}
        action={
          <button
            onClick={() => setEditModal({ ...EMPTY_DISEASE })}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={diseases}
        loading={loading}
        onEdit={(row) => setEditModal({ ...row })}
        onDelete={setDeleteTarget}
        emptyIcon={Stethoscope}
        emptyTitle="Заболеваний пока нет"
        emptyDescription="Добавьте первое заболевание"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id ? 'Редактировать заболевание' : 'Добавить заболевание'}
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Name */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Название (${lang.toUpperCase()})`}
                  name={`name_${lang}`}
                  value={editModal[`name_${lang}`]}
                  onChange={(e) => updateField(`name_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder={
                    lang === 'ru' ? 'Ревматоидный артрит'
                    : lang === 'uz' ? 'Revmatoid artrit'
                    : 'Rheumatoid Arthritis'
                  }
                />
              )}
            </LangTabs>

            {/* Short name */}
            <AdminFormField
              label="Краткое название / аббревиатура"
              name="short_name"
              value={editModal.short_name}
              onChange={(e) => updateField('short_name', e.target.value)}
              placeholder="РА"
              className="w-48"
            />

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
                  placeholder="Краткое описание заболевания"
                />
              )}
            </LangTabs>

            {/* Symptoms */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Симптомы (${lang.toUpperCase()})`}
                  name={`symptoms_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`symptoms_${lang}`]}
                  onChange={(e) => updateField(`symptoms_${lang}`, e.target.value)}
                  placeholder="Основные симптомы заболевания"
                />
              )}
            </LangTabs>

            {/* Treatment */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Лечение (${lang.toUpperCase()})`}
                  name={`treatment_${lang}`}
                  type="textarea"
                  rows={3}
                  value={editModal[`treatment_${lang}`]}
                  onChange={(e) => updateField(`treatment_${lang}`, e.target.value)}
                  placeholder="Методы лечения"
                />
              )}
            </LangTabs>

            {/* Content (HTML) */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Контент страницы HTML (${lang.toUpperCase()})`}
                  name={`content_${lang}`}
                  type="textarea"
                  rows={6}
                  value={editModal[`content_${lang}`]}
                  onChange={(e) => updateField(`content_${lang}`, e.target.value)}
                  placeholder={
                    lang === 'ru' ? '<h3>Заголовок</h3><p>Текст...</p>'
                    : lang === 'uz' ? '<h3>Sarlavha</h3><p>Matn...</p>'
                    : '<h3>Title</h3><p>Text...</p>'
                  }
                />
              )}
            </LangTabs>

            {/* Document uploads */}
            <div className="grid grid-cols-2 gap-4">
              <FileUpload
                label="Клинические рекомендации (PDF)"
                value={editModal.recommendation_file_url}
                onChange={handleRecommendationUpload}
                accept=".pdf,.doc,.docx"
                preview
              />
              <FileUpload
                label="Клинический протокол (PDF)"
                value={editModal.protocol_file_url}
                onChange={handleProtocolUpload}
                accept=".pdf,.doc,.docx"
                preview
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
        title="Удалить заболевание?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.name_ru}"? Прикреплённые документы также будут удалены.`}
        loading={deleting}
      />
    </div>
  );
};

export default DiseasesAdmin;
