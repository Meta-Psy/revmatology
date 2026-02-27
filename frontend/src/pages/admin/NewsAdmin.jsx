import { useState, useEffect } from 'react';
import { Plus, Newspaper, Star } from 'lucide-react';
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
  news_type: 'news',
  title_ru: '', title_uz: '', title_en: '',
  subtitle_ru: '', subtitle_uz: '', subtitle_en: '',
  content_ru: '', content_uz: '', content_en: '',
  excerpt_ru: '', excerpt_uz: '', excerpt_en: '',
  image_url: '',
  background_image_url: '',
  event_date_start: '',
  event_date_end: '',
  event_location_ru: '', event_location_uz: '', event_location_en: '',
  registration_url: '',
  is_published: false,
  is_featured: false,
};

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'news', label: 'Новости' },
  { key: 'event', label: 'События' },
];

const columns = [
  {
    key: 'title_ru',
    label: 'Заголовок (RU)',
    sortable: true,
    render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-800 truncate max-w-xs">{val || '---'}</span>
        {row.is_featured && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded">
            <Star className="w-3 h-3" />
            Карусель
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'news_type',
    label: 'Тип',
    sortable: true,
    width: 'w-28',
    render: (val) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        val === 'event'
          ? 'bg-purple-50 text-purple-700'
          : 'bg-blue-50 text-blue-700'
      }`}>
        {val === 'event' ? 'Событие' : 'Новость'}
      </span>
    ),
  },
  {
    key: 'is_published',
    label: 'Статус',
    sortable: true,
    width: 'w-32',
    render: (val) => (
      <StatusBadge active={val} activeText="Опубликовано" inactiveText="Черновик" />
    ),
  },
  {
    key: 'is_featured',
    label: 'Избранное',
    sortable: true,
    width: 'w-28',
    render: (val) => (
      <StatusBadge active={val} activeText="Да" inactiveText="Нет" />
    ),
  },
  {
    key: 'created_at',
    label: 'Дата',
    sortable: true,
    width: 'w-28',
    render: (val, row) => (
      <span className="text-slate-500 text-xs">
        {row.event_date_start
          ? new Date(row.event_date_start).toLocaleDateString('ru-RU')
          : val
            ? new Date(val).toLocaleDateString('ru-RU')
            : '---'}
      </span>
    ),
  },
];

const NewsAdmin = () => {
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
  }, [filter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const newsType = filter === 'all' ? null : filter;
      const res = await contentAPI.getNews(newsType, false, 0, 100);
      setItems(res.data);
    } catch {
      toast.error('Ошибка загрузки новостей');
    } finally {
      setLoading(false);
    }
  };

  const formatDateLocal = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.slice(0, 16);
  };

  const handleEdit = (row) => {
    setEditModal({
      ...row,
      event_date_start: formatDateLocal(row.event_date_start),
      event_date_end: formatDateLocal(row.event_date_end),
    });
  };

  const handleCreate = () => setEditModal({ ...EMPTY_ITEM });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...editModal };
      if (!data.event_date_start) data.event_date_start = null;
      if (!data.event_date_end) data.event_date_end = null;

      if (editModal.id) {
        await contentAPI.updateNews(editModal.id, data);
      } else {
        await contentAPI.createNews(data);
      }
      toast.success(editModal.id ? 'Запись обновлена' : 'Запись добавлена');
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
      await contentAPI.deleteNews(deleteTarget.id);
      setItems(items.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Запись удалена');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (file, field) => {
    if (!file) {
      setEditModal(prev => ({ ...prev, [field]: '' }));
      return;
    }
    try {
      const res = await contentAPI.uploadFile(file);
      setEditModal(prev => ({ ...prev, [field]: res.data.url }));
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
        title="Новости и события"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Новости и события' },
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
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyIcon={Newspaper}
        emptyTitle={filter === 'event' ? 'Событий пока нет' : 'Новостей пока нет'}
        emptyDescription="Нажмите кнопку выше, чтобы добавить"
      />

      {/* Edit / Create Modal */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.id
          ? `Редактировать ${editModal.news_type === 'event' ? 'событие' : 'новость'}`
          : `Добавить ${editModal?.news_type === 'event' ? 'событие' : 'новость'}`
        }
        size="lg"
      >
        {editModal && (
          <AdminForm
            onSubmit={handleSave}
            loading={saving}
            onCancel={() => setEditModal(null)}
          >
            {/* Type & Options */}
            <div className="flex items-end gap-6">
              <AdminFormField
                label="Тип"
                name="news_type"
                type="select"
                value={editModal.news_type}
                onChange={(e) => updateField('news_type', e.target.value)}
                options={[
                  { value: 'news', label: 'Новость' },
                  { value: 'event', label: 'Событие' },
                ]}
                className="w-40"
              />
              <AdminFormField
                label="Показывать в карусели"
                name="is_featured"
                type="checkbox"
                value={editModal.is_featured}
                onChange={(e) => updateField('is_featured', e.target.value)}
              />
              <AdminFormField
                label="Опубликовать"
                name="is_published"
                type="checkbox"
                value={editModal.is_published}
                onChange={(e) => updateField('is_published', e.target.value)}
              />
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <FileUpload
                label={editModal.news_type === 'event' ? 'Картинка события' : 'Картинка новости'}
                value={editModal.image_url}
                onChange={(file) => handleImageUpload(file, 'image_url')}
                accept="image/*"
              />
              {editModal.news_type === 'event' && (
                <FileUpload
                  label="Фоновая картинка"
                  value={editModal.background_image_url}
                  onChange={(file) => handleImageUpload(file, 'background_image_url')}
                  accept="image/*"
                />
              )}
            </div>

            {/* Title */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Заголовок (${lang.toUpperCase()})`}
                  name={`title_${lang}`}
                  value={editModal[`title_${lang}`]}
                  onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="Заголовок"
                />
              )}
            </LangTabs>

            {/* Subtitle (only for news type) */}
            {editModal.news_type === 'news' && (
              <LangTabs>
                {(lang) => (
                  <AdminFormField
                    label={`Подзаголовок (${lang.toUpperCase()})`}
                    name={`subtitle_${lang}`}
                    value={editModal[`subtitle_${lang}`]}
                    onChange={(e) => updateField(`subtitle_${lang}`, e.target.value)}
                    placeholder="Раскрывает суть новости"
                  />
                )}
              </LangTabs>
            )}

            {/* Excerpt */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Краткое описание (${lang.toUpperCase()})`}
                  name={`excerpt_${lang}`}
                  type="textarea"
                  rows={2}
                  value={editModal[`excerpt_${lang}`]}
                  onChange={(e) => updateField(`excerpt_${lang}`, e.target.value)}
                  placeholder="Краткое описание для карточки"
                />
              )}
            </LangTabs>

            {/* Content (HTML) */}
            <LangTabs>
              {(lang) => (
                <AdminFormField
                  label={`Содержание (${lang.toUpperCase()})`}
                  name={`content_${lang}`}
                  type="textarea"
                  rows={5}
                  value={editModal[`content_${lang}`]}
                  onChange={(e) => updateField(`content_${lang}`, e.target.value)}
                  required={lang === 'ru'}
                  placeholder="HTML-содержание"
                />
              )}
            </LangTabs>

            {/* Event-specific fields */}
            {editModal.news_type === 'event' && (
              <>
                {/* Event dates */}
                <div className="grid grid-cols-2 gap-4">
                  <AdminFormField
                    label="Дата начала"
                    name="event_date_start"
                    type="datetime-local"
                    value={editModal.event_date_start}
                    onChange={(e) => updateField('event_date_start', e.target.value)}
                    required
                  />
                  <AdminFormField
                    label="Дата окончания"
                    name="event_date_end"
                    type="datetime-local"
                    value={editModal.event_date_end}
                    onChange={(e) => updateField('event_date_end', e.target.value)}
                  />
                </div>

                {/* Event location */}
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Место проведения (${lang.toUpperCase()})`}
                      name={`event_location_${lang}`}
                      value={editModal[`event_location_${lang}`]}
                      onChange={(e) => updateField(`event_location_${lang}`, e.target.value)}
                      placeholder="г. Ташкент"
                    />
                  )}
                </LangTabs>

                {/* Registration URL */}
                <AdminFormField
                  label="Ссылка на регистрацию"
                  name="registration_url"
                  type="url"
                  value={editModal.registration_url}
                  onChange={(e) => updateField('registration_url', e.target.value)}
                  placeholder="https://forms.google.com/..."
                />
              </>
            )}
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

export default NewsAdmin;
