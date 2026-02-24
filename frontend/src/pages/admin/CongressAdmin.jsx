import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Calendar, LayoutList, Mic, Users, Download } from 'lucide-react';
import { contentAPI } from '../../services/api';
import {
  PageHeader, AdminTable, AdminModal, ConfirmDialog, AdminForm,
  AdminFormField, LangTabs, FileUpload, StatusBadge, Skeleton, EmptyState, useToast,
} from '../../components/admin';

// ---------------------------------------------------------------------------
// TABS CONFIG
// ---------------------------------------------------------------------------
const TABS = [
  { key: 'congresses', label: 'Конгрессы', icon: Building2 },
  { key: 'sponsors', label: 'Спонсоры', icon: Building2 },
  { key: 'days', label: 'Дни программы', icon: Calendar },
  { key: 'sections', label: 'Секции', icon: LayoutList },
  { key: 'speakers', label: 'Спикеры', icon: Mic },
  { key: 'registrations', label: 'Регистрации', icon: Users },
];

// ---------------------------------------------------------------------------
// EMPTY MODELS
// ---------------------------------------------------------------------------
const EMPTY_CONGRESS = {
  title_ru: '', title_uz: '', title_en: '',
  description_ru: '', description_uz: '', description_en: '',
  date_start: '', date_end: '',
  location_ru: '', location_uz: '', location_en: '',
  image_url: '', is_active: true, registration_open: true,
  about_ru: '', about_uz: '', about_en: '',
  organizers_ru: '', organizers_uz: '', organizers_en: '',
  young_scientists_ru: '', young_scientists_uz: '', young_scientists_en: '',
  contact_publications_phone: '', contact_publications_email: '',
  contact_registration_phone: '', contact_registration_email: '',
  contact_participation_phone: '', contact_participation_email: '',
  info_letter_ru: '', info_letter_uz: '', info_letter_en: '',
  info_letter_file_ru: '', info_letter_file_uz: '', info_letter_file_en: '',
};

const EMPTY_SPONSOR = {
  name_ru: '', name_uz: '', name_en: '',
  description_ru: '', description_uz: '', description_en: '',
  logo_url: '', website_url: '', order: 0, is_active: true,
};

const EMPTY_DAY = {
  date: '', title_ru: '', title_uz: '', title_en: '',
  description_ru: '', description_uz: '', description_en: '', order: 0,
};

const EMPTY_SECTION = {
  title_ru: '', title_uz: '', title_en: '',
  description_ru: '', description_uz: '', description_en: '', order: 0,
};

const EMPTY_SPEAKER = {
  last_name_ru: '', last_name_uz: '', last_name_en: '',
  first_name_ru: '', first_name_uz: '', first_name_en: '',
  patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
  degree_ru: '', degree_uz: '', degree_en: '',
  workplace_ru: '', workplace_uz: '', workplace_en: '',
  topic_ru: '', topic_uz: '', topic_en: '',
  section_id: null, time_start: '', time_end: '',
  photo_url: '', order: 0, is_active: true,
};

// ---------------------------------------------------------------------------
// COLUMN DEFINITIONS
// ---------------------------------------------------------------------------
const congressColumns = [
  {
    key: 'title_ru', label: 'Название', sortable: true,
    render: (val) => <span className="font-medium text-slate-800">{val || '--'}</span>,
  },
  {
    key: 'date_start', label: 'Дата начала', sortable: true, width: 'w-36',
    render: (val) => <span className="text-slate-600">{val ? new Date(val).toLocaleDateString('ru-RU') : '--'}</span>,
  },
  {
    key: 'is_active', label: 'Статус', sortable: true, width: 'w-28',
    render: (val) => <StatusBadge active={val} />,
  },
  {
    key: 'registration_open', label: 'Регистрация', sortable: true, width: 'w-28',
    render: (val) => <StatusBadge active={val} activeText="Открыта" inactiveText="Закрыта" />,
  },
];

const sponsorColumns = [
  {
    key: 'logo_url', label: 'Лого', sortable: false, width: 'w-16',
    render: (val, row) => (
      <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
        {val ? <img src={val} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-xs font-bold text-slate-400">{(row.name_ru || '?')[0]}</span>}
      </div>
    ),
  },
  {
    key: 'name_ru', label: 'Название', sortable: true,
    render: (val) => <span className="font-medium text-slate-800">{val || '--'}</span>,
  },
  {
    key: 'website_url', label: 'Сайт', sortable: false, width: 'w-40',
    render: (val) => val ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-xs truncate max-w-[140px] inline-block">{val.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-slate-400">--</span>,
  },
  { key: 'order', label: 'Порядок', sortable: true, width: 'w-24', render: (val) => <span className="text-slate-500">{val ?? 0}</span> },
  { key: 'is_active', label: 'Статус', sortable: true, width: 'w-28', render: (val) => <StatusBadge active={val} /> },
];

const dayColumns = [
  {
    key: 'title_ru', label: 'Название', sortable: true,
    render: (val) => <span className="font-medium text-slate-800">{val || '--'}</span>,
  },
  {
    key: 'date', label: 'Дата', sortable: true, width: 'w-36',
    render: (val) => <span className="text-slate-600">{val ? new Date(val).toLocaleDateString('ru-RU') : '--'}</span>,
  },
  { key: 'order', label: 'Порядок', sortable: true, width: 'w-24', render: (val) => <span className="text-slate-500">{val ?? 0}</span> },
];

const sectionColumns = [
  {
    key: 'title_ru', label: 'Название', sortable: true,
    render: (val) => <span className="font-medium text-slate-800">{val || '--'}</span>,
  },
  { key: 'order', label: 'Порядок', sortable: true, width: 'w-24', render: (val) => <span className="text-slate-500">{val ?? 0}</span> },
];

const speakerColumns = [
  {
    key: 'last_name_ru', label: 'ФИО', sortable: true,
    render: (_, row) => <span className="font-medium text-slate-800">{row.last_name_ru} {row.first_name_ru} {row.patronymic_ru || ''}</span>,
  },
  { key: 'degree_ru', label: 'Степень', sortable: true, width: 'w-40', render: (val) => <span className="text-slate-600">{val || '--'}</span> },
  { key: 'topic_ru', label: 'Тема', sortable: false, render: (val) => <span className="text-slate-600 truncate max-w-[200px] inline-block">{val || '--'}</span> },
  { key: 'is_active', label: 'Статус', sortable: true, width: 'w-28', render: (val) => <StatusBadge active={val} /> },
];

const registrationColumns = [
  {
    key: 'last_name', label: 'ФИО', sortable: true,
    render: (_, row) => <span className="font-medium text-slate-800">{row.last_name} {row.first_name} {row.patronymic || ''}</span>,
  },
  {
    key: 'email', label: 'Контакты', sortable: true,
    render: (val, row) => (
      <div>
        <div className="text-slate-800">{val}</div>
        {row.phone && <div className="text-xs text-slate-400">{row.phone}</div>}
      </div>
    ),
  },
  { key: 'organization', label: 'Организация', sortable: true, render: (val) => <span className="text-slate-600">{val || '--'}</span> },
  { key: 'position', label: 'Должность', sortable: true, render: (val) => <span className="text-slate-600">{val || '--'}</span> },
  {
    key: 'created_at', label: 'Дата', sortable: true, width: 'w-28',
    render: (val) => <span className="text-slate-500">{val ? new Date(val).toLocaleDateString('ru-RU') : '--'}</span>,
  },
];

// ---------------------------------------------------------------------------
// CSV EXPORT HELPER
// ---------------------------------------------------------------------------
const exportRegistrationsCSV = (registrations) => {
  const headers = ['Фамилия', 'Имя', 'Отчество', 'Email', 'Телефон', 'Организация', 'Должность', 'Дата'];
  const rows = registrations.map(r => [
    r.last_name, r.first_name, r.patronymic || '', r.email, r.phone || '',
    r.organization || '', r.position || '', new Date(r.created_at).toLocaleDateString('ru-RU'),
  ]);
  const csvContent = [headers, ...rows].map(row => row.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'congress_registrations.csv';
  link.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// CONGRESS FORM SUB-TABS
// ---------------------------------------------------------------------------
const CONGRESS_FORM_TABS = [
  { key: 'basic', label: 'Основное' },
  { key: 'tabs', label: 'Вкладки' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'infoLetter', label: 'Инфо-письмо' },
];

const CONGRESS_TAB_FIELDS = [
  { field: 'about', label: 'О конгрессе' },
  { field: 'organizers', label: 'Организаторы' },
  { field: 'young_scientists', label: 'Конкурс молодых ученых' },
];

const CONTACT_BLOCKS = [
  { prefix: 'contact_publications', label: 'По вопросам публикаций' },
  { prefix: 'contact_registration', label: 'По вопросам регистрации' },
  { prefix: 'contact_participation', label: 'По вопросам участия' },
];

// ---------------------------------------------------------------------------
// CONGRESS FORM MODAL CONTENT
// ---------------------------------------------------------------------------
const CongressFormContent = ({ form, updateField, onImageUpload }) => {
  const [formTab, setFormTab] = useState('basic');

  return (
    <>
      {/* Sub-tabs within the congress form */}
      <div className="flex gap-0.5 mb-4 bg-slate-100 rounded-md p-0.5 w-fit">
        {CONGRESS_FORM_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFormTab(t.key)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              formTab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {formTab === 'basic' && (
        <>
          <LangTabs>
            {(lang) => (
              <AdminFormField
                label={`Название (${lang.toUpperCase()})`}
                name={`title_${lang}`}
                value={form[`title_${lang}`]}
                onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                required={lang === 'ru'}
              />
            )}
          </LangTabs>

          <LangTabs>
            {(lang) => (
              <AdminFormField
                label={`Описание (${lang.toUpperCase()})`}
                name={`description_${lang}`}
                type="textarea"
                rows={3}
                value={form[`description_${lang}`]}
                onChange={(e) => updateField(`description_${lang}`, e.target.value)}
              />
            )}
          </LangTabs>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField
              label="Дата начала"
              name="date_start"
              type="datetime-local"
              value={form.date_start ? form.date_start.substring(0, 16) : ''}
              onChange={(e) => updateField('date_start', e.target.value)}
            />
            <AdminFormField
              label="Дата окончания"
              name="date_end"
              type="datetime-local"
              value={form.date_end ? form.date_end.substring(0, 16) : ''}
              onChange={(e) => updateField('date_end', e.target.value)}
            />
          </div>

          <LangTabs>
            {(lang) => (
              <AdminFormField
                label={`Место проведения (${lang.toUpperCase()})`}
                name={`location_${lang}`}
                value={form[`location_${lang}`]}
                onChange={(e) => updateField(`location_${lang}`, e.target.value)}
              />
            )}
          </LangTabs>

          <FileUpload
            label="Изображение"
            value={form.image_url}
            onChange={onImageUpload}
            accept="image/*"
          />

          <div className="flex items-end gap-6">
            <AdminFormField
              label="Активен"
              name="is_active"
              type="checkbox"
              value={form.is_active}
              onChange={(e) => updateField('is_active', e.target.value)}
            />
            <AdminFormField
              label="Регистрация открыта"
              name="registration_open"
              type="checkbox"
              value={form.registration_open}
              onChange={(e) => updateField('registration_open', e.target.value)}
            />
          </div>
        </>
      )}

      {formTab === 'tabs' && (
        <>
          {CONGRESS_TAB_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
              <LangTabs>
                {(lang) => (
                  <AdminFormField
                    label={lang.toUpperCase()}
                    name={`${field}_${lang}`}
                    type="textarea"
                    rows={4}
                    value={form[`${field}_${lang}`]}
                    onChange={(e) => updateField(`${field}_${lang}`, e.target.value)}
                  />
                )}
              </LangTabs>
            </div>
          ))}
        </>
      )}

      {formTab === 'contacts' && (
        <>
          {CONTACT_BLOCKS.map(({ prefix, label }) => (
            <div key={prefix}>
              <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
              <div className="grid grid-cols-2 gap-4">
                <AdminFormField
                  label="Телефон"
                  name={`${prefix}_phone`}
                  value={form[`${prefix}_phone`]}
                  onChange={(e) => updateField(`${prefix}_phone`, e.target.value)}
                />
                <AdminFormField
                  label="Email"
                  name={`${prefix}_email`}
                  type="email"
                  value={form[`${prefix}_email`]}
                  onChange={(e) => updateField(`${prefix}_email`, e.target.value)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {formTab === 'infoLetter' && (
        <>
          <LangTabs>
            {(lang) => (
              <AdminFormField
                label={`Контент (${lang.toUpperCase()})`}
                name={`info_letter_${lang}`}
                type="textarea"
                rows={4}
                value={form[`info_letter_${lang}`]}
                onChange={(e) => updateField(`info_letter_${lang}`, e.target.value)}
              />
            )}
          </LangTabs>
          <LangTabs>
            {(lang) => (
              <AdminFormField
                label={`PDF файл URL (${lang.toUpperCase()})`}
                name={`info_letter_file_${lang}`}
                value={form[`info_letter_file_${lang}`]}
                onChange={(e) => updateField(`info_letter_file_${lang}`, e.target.value)}
                placeholder="https://..."
              />
            )}
          </LangTabs>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
const CongressAdmin = () => {
  const toast = useToast();

  // --- Data state ---
  const [congresses, setCongresses] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [programDays, setProgramDays] = useState([]);
  const [sections, setSections] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- UI state ---
  const [activeTab, setActiveTab] = useState('congresses');
  const [selectedCongressId, setSelectedCongressId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);

  // --- Modal state ---
  const [editModal, setEditModal] = useState(null);   // null = closed, object = editing
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------
  const loadCongresses = useCallback(async () => {
    try {
      const res = await contentAPI.getCongresses(true);
      const list = res.data || [];
      setCongresses(list);
      if (list.length > 0 && !selectedCongressId) {
        setSelectedCongressId(list[0].id);
      }
    } catch {
      toast.error('Ошибка загрузки конгрессов');
    } finally {
      setLoading(false);
    }
  }, [selectedCongressId]);

  const loadCongressData = useCallback(async () => {
    if (!selectedCongressId) return;
    try {
      const [sp, days, spk, regs] = await Promise.all([
        contentAPI.getCongressSponsors(selectedCongressId, true),
        contentAPI.getCongressProgramDays(selectedCongressId),
        contentAPI.getCongressSpeakers(selectedCongressId, null, true),
        contentAPI.getCongressRegistrations(selectedCongressId).catch(() => ({ data: [] })),
      ]);
      setSponsors(sp.data || []);
      const daysList = days.data || [];
      setProgramDays(daysList);
      setSpeakers(spk.data || []);
      setRegistrations(regs.data || []);
      if (daysList.length > 0 && !selectedDayId) {
        setSelectedDayId(daysList[0].id);
      }
    } catch {
      toast.error('Ошибка загрузки данных конгресса');
    }
  }, [selectedCongressId]);

  const loadSections = useCallback(async () => {
    if (!selectedDayId) { setSections([]); return; }
    try {
      const res = await contentAPI.getCongressProgramSections(selectedDayId);
      setSections(res.data || []);
    } catch {
      toast.error('Ошибка загрузки секций');
    }
  }, [selectedDayId]);

  useEffect(() => { loadCongresses(); }, []);
  useEffect(() => { if (selectedCongressId) loadCongressData(); }, [selectedCongressId]);
  useEffect(() => { loadSections(); }, [selectedDayId]);

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS (generic pattern)
  // ---------------------------------------------------------------------------
  const apiMap = {
    congresses: { create: contentAPI.createCongress, update: contentAPI.updateCongress, delete: contentAPI.deleteCongress },
    sponsors:   { create: contentAPI.createCongressSponsor, update: contentAPI.updateCongressSponsor, delete: contentAPI.deleteCongressSponsor },
    days:       { create: contentAPI.createCongressProgramDay, update: contentAPI.updateCongressProgramDay, delete: contentAPI.deleteCongressProgramDay },
    sections:   { create: contentAPI.createCongressProgramSection, update: contentAPI.updateCongressProgramSection, delete: contentAPI.deleteCongressProgramSection },
    speakers:   { create: contentAPI.createCongressSpeaker, update: contentAPI.updateCongressSpeaker, delete: contentAPI.deleteCongressSpeaker },
  };

  const reloadTab = async (tab) => {
    if (tab === 'congresses') await loadCongresses();
    else if (tab === 'sections') await loadSections();
    else await loadCongressData();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { _tab, ...data } = editModal;
      const api = apiMap[_tab];
      if (data.id) {
        const { congress_id, day_id, ...updateData } = data;
        await api.update(data.id, updateData);
        toast.success('Запись обновлена');
      } else {
        // Attach foreign keys for child entities
        if (_tab === 'sponsors' || _tab === 'days' || _tab === 'speakers') {
          data.congress_id = selectedCongressId;
        }
        if (_tab === 'sections') {
          data.day_id = selectedDayId;
        }
        if (_tab === 'speakers') {
          data.section_id = data.section_id || null;
        }
        await api.create(data);
        toast.success('Запись создана');
      }
      setEditModal(null);
      await reloadTab(_tab);
    } catch (err) {
      toast.error('Ошибка сохранения: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { _tab, id } = deleteTarget;
      await apiMap[_tab].delete(id);
      setDeleteTarget(null);
      toast.success('Запись удалена');
      await reloadTab(_tab);
    } catch (err) {
      toast.error('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MODAL HELPERS
  // ---------------------------------------------------------------------------
  const openCreate = (tab, empty) => setEditModal({ _tab: tab, ...empty });
  const openEdit = (tab, row) => setEditModal({ _tab: tab, ...row });
  const openDelete = (tab, row) => setDeleteTarget({ _tab: tab, ...row });

  const updateField = (field, value) => {
    setEditModal(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file, field = 'image_url') => {
    if (!file) { updateField(field, ''); return; }
    try {
      const res = await contentAPI.uploadFile(file);
      updateField(field, res.data.url);
      toast.success('Файл загружен');
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  };

  // ---------------------------------------------------------------------------
  // TAB SWITCH
  // ---------------------------------------------------------------------------
  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setEditModal(null);
    setDeleteTarget(null);
  };

  // ---------------------------------------------------------------------------
  // CONGRESS SELECTOR (shown for all tabs except congresses)
  // ---------------------------------------------------------------------------
  const CongressSelector = () => {
    if (activeTab === 'congresses' || congresses.length === 0) return null;
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-slate-500">Конгресс:</span>
        <select
          value={selectedCongressId || ''}
          onChange={(e) => {
            setSelectedCongressId(parseInt(e.target.value));
            setSelectedDayId(null);
          }}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {congresses.map(c => <option key={c.id} value={c.id}>{c.title_ru}</option>)}
        </select>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // DAY SELECTOR (shown only for sections tab)
  // ---------------------------------------------------------------------------
  const DaySelector = () => {
    if (activeTab !== 'sections' || programDays.length === 0) return null;
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-slate-500">День:</span>
        <select
          value={selectedDayId || ''}
          onChange={(e) => setSelectedDayId(parseInt(e.target.value))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {programDays.map(d => <option key={d.id} value={d.id}>{d.title_ru} {d.date ? `(${new Date(d.date).toLocaleDateString('ru-RU')})` : ''}</option>)}
        </select>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // DELETE NAME HELPER
  // ---------------------------------------------------------------------------
  const getDeleteName = () => {
    if (!deleteTarget) return '';
    return deleteTarget.title_ru || deleteTarget.name_ru ||
      (deleteTarget.last_name_ru ? `${deleteTarget.last_name_ru} ${deleteTarget.first_name_ru}` : '') ||
      `#${deleteTarget.id}`;
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  if (loading) return <Skeleton rows={6} cols={4} />;

  const needsCongress = activeTab !== 'congresses' && !selectedCongressId;
  const needsDay = activeTab === 'sections' && !selectedDayId;

  return (
    <div>
      <PageHeader
        title="Управление конгрессами"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Конгрессы' },
        ]}
      />

      {/* ===== Tab Bar ===== */}
      <div className="flex gap-0.5 mb-5 bg-slate-100 rounded-md p-0.5 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CongressSelector />
      <DaySelector />

      {/* ===== Empty state when no congress selected ===== */}
      {needsCongress && (
        <EmptyState
          icon={Building2}
          title="Сначала создайте конгресс"
          description="Перейдите на вкладку Конгрессы и добавьте хотя бы один конгресс"
        />
      )}

      {needsDay && !needsCongress && (
        <EmptyState
          icon={Calendar}
          title="Нет дней программы"
          description="Сначала добавьте дни программы на соответствующей вкладке"
        />
      )}

      {/* ===================================================================== */}
      {/* CONGRESSES TAB                                                        */}
      {/* ===================================================================== */}
      {activeTab === 'congresses' && (
        <>
          <div className="mb-4">
            <button
              onClick={() => openCreate('congresses', EMPTY_CONGRESS)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить конгресс
            </button>
          </div>
          <AdminTable
            columns={congressColumns}
            data={congresses}
            onEdit={(row) => openEdit('congresses', row)}
            onDelete={(row) => openDelete('congresses', row)}
            emptyIcon={Building2}
            emptyTitle="Конгрессов пока нет"
            emptyDescription="Добавьте первый конгресс"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* SPONSORS TAB                                                          */}
      {/* ===================================================================== */}
      {activeTab === 'sponsors' && !needsCongress && (
        <>
          <div className="mb-4">
            <button
              onClick={() => openCreate('sponsors', EMPTY_SPONSOR)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить спонсора
            </button>
          </div>
          <AdminTable
            columns={sponsorColumns}
            data={sponsors}
            onEdit={(row) => openEdit('sponsors', row)}
            onDelete={(row) => openDelete('sponsors', row)}
            emptyIcon={Building2}
            emptyTitle="Спонсоров пока нет"
            emptyDescription="Добавьте первого спонсора"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* PROGRAM DAYS TAB                                                      */}
      {/* ===================================================================== */}
      {activeTab === 'days' && !needsCongress && (
        <>
          <div className="mb-4">
            <button
              onClick={() => openCreate('days', EMPTY_DAY)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить день
            </button>
          </div>
          <AdminTable
            columns={dayColumns}
            data={programDays}
            onEdit={(row) => openEdit('days', row)}
            onDelete={(row) => openDelete('days', row)}
            emptyIcon={Calendar}
            emptyTitle="Дней программы пока нет"
            emptyDescription="Добавьте первый день программы"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* SECTIONS TAB                                                          */}
      {/* ===================================================================== */}
      {activeTab === 'sections' && !needsCongress && !needsDay && (
        <>
          <div className="mb-4">
            <button
              onClick={() => openCreate('sections', EMPTY_SECTION)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить секцию
            </button>
          </div>
          <AdminTable
            columns={sectionColumns}
            data={sections}
            onEdit={(row) => openEdit('sections', row)}
            onDelete={(row) => openDelete('sections', row)}
            emptyIcon={LayoutList}
            emptyTitle="Секций пока нет"
            emptyDescription="Добавьте первую секцию"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* SPEAKERS TAB                                                          */}
      {/* ===================================================================== */}
      {activeTab === 'speakers' && !needsCongress && (
        <>
          <div className="mb-4">
            <button
              onClick={() => openCreate('speakers', EMPTY_SPEAKER)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить спикера
            </button>
          </div>
          <AdminTable
            columns={speakerColumns}
            data={speakers}
            onEdit={(row) => openEdit('speakers', row)}
            onDelete={(row) => openDelete('speakers', row)}
            emptyIcon={Mic}
            emptyTitle="Спикеров пока нет"
            emptyDescription="Добавьте первого спикера"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* REGISTRATIONS TAB (read-only)                                         */}
      {/* ===================================================================== */}
      {activeTab === 'registrations' && !needsCongress && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Всего заявок: {registrations.length}</span>
            {registrations.length > 0 && (
              <button
                onClick={() => exportRegistrationsCSV(registrations)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Экспорт CSV
              </button>
            )}
          </div>
          <AdminTable
            columns={registrationColumns}
            data={registrations}
            emptyIcon={Users}
            emptyTitle="Регистраций пока нет"
            emptyDescription="Заявки появятся после открытия регистрации"
          />
        </>
      )}

      {/* ===================================================================== */}
      {/* EDIT / CREATE MODAL                                                   */}
      {/* ===================================================================== */}
      <AdminModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={
          editModal?.id
            ? `Редактировать ${editModal._tab === 'congresses' ? 'конгресс' : editModal._tab === 'sponsors' ? 'спонсора' : editModal._tab === 'days' ? 'день' : editModal._tab === 'sections' ? 'секцию' : 'спикера'}`
            : `Добавить ${editModal?._tab === 'congresses' ? 'конгресс' : editModal?._tab === 'sponsors' ? 'спонсора' : editModal?._tab === 'days' ? 'день' : editModal?._tab === 'sections' ? 'секцию' : 'спикера'}`
        }
        size="lg"
      >
        {editModal && (
          <AdminForm onSubmit={handleSave} loading={saving} onCancel={() => setEditModal(null)}>

            {/* ---------- CONGRESS FORM ---------- */}
            {editModal._tab === 'congresses' && (
              <CongressFormContent
                form={editModal}
                updateField={updateField}
                onImageUpload={(file) => handleImageUpload(file, 'image_url')}
              />
            )}

            {/* ---------- SPONSOR FORM ---------- */}
            {editModal._tab === 'sponsors' && (
              <>
                <FileUpload
                  label="Логотип"
                  value={editModal.logo_url}
                  onChange={(file) => handleImageUpload(file, 'logo_url')}
                  accept="image/*"
                />
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Название (${lang.toUpperCase()})`}
                      name={`name_${lang}`}
                      value={editModal[`name_${lang}`]}
                      onChange={(e) => updateField(`name_${lang}`, e.target.value)}
                      required={lang === 'ru'}
                    />
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Описание (${lang.toUpperCase()})`}
                      name={`description_${lang}`}
                      type="textarea"
                      rows={3}
                      value={editModal[`description_${lang}`]}
                      onChange={(e) => updateField(`description_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <div className="grid grid-cols-2 gap-4">
                  <AdminFormField
                    label="Сайт"
                    name="website_url"
                    type="url"
                    value={editModal.website_url}
                    onChange={(e) => updateField('website_url', e.target.value)}
                    placeholder="https://..."
                  />
                  <AdminFormField
                    label="Порядок"
                    name="order"
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                    className="w-28"
                  />
                </div>
                <AdminFormField
                  label="Активен"
                  name="is_active"
                  type="checkbox"
                  value={editModal.is_active}
                  onChange={(e) => updateField('is_active', e.target.value)}
                />
              </>
            )}

            {/* ---------- DAY FORM ---------- */}
            {editModal._tab === 'days' && (
              <>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Название (${lang.toUpperCase()})`}
                      name={`title_${lang}`}
                      value={editModal[`title_${lang}`]}
                      onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                      required={lang === 'ru'}
                    />
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Описание (${lang.toUpperCase()})`}
                      name={`description_${lang}`}
                      type="textarea"
                      rows={3}
                      value={editModal[`description_${lang}`]}
                      onChange={(e) => updateField(`description_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <div className="grid grid-cols-2 gap-4">
                  <AdminFormField
                    label="Дата"
                    name="date"
                    type="date"
                    value={editModal.date || ''}
                    onChange={(e) => updateField('date', e.target.value)}
                  />
                  <AdminFormField
                    label="Порядок"
                    name="order"
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                    className="w-28"
                  />
                </div>
              </>
            )}

            {/* ---------- SECTION FORM ---------- */}
            {editModal._tab === 'sections' && (
              <>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Название (${lang.toUpperCase()})`}
                      name={`title_${lang}`}
                      value={editModal[`title_${lang}`]}
                      onChange={(e) => updateField(`title_${lang}`, e.target.value)}
                      required={lang === 'ru'}
                    />
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Описание (${lang.toUpperCase()})`}
                      name={`description_${lang}`}
                      type="textarea"
                      rows={3}
                      value={editModal[`description_${lang}`]}
                      onChange={(e) => updateField(`description_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <AdminFormField
                  label="Порядок"
                  name="order"
                  type="number"
                  value={editModal.order}
                  onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                  className="w-28"
                />
              </>
            )}

            {/* ---------- SPEAKER FORM ---------- */}
            {editModal._tab === 'speakers' && (
              <>
                <FileUpload
                  label="Фото"
                  value={editModal.photo_url}
                  onChange={(file) => handleImageUpload(file, 'photo_url')}
                  accept="image/*"
                />
                <LangTabs>
                  {(lang) => (
                    <div className="grid grid-cols-3 gap-3">
                      <AdminFormField
                        label={`Фамилия (${lang.toUpperCase()})`}
                        name={`last_name_${lang}`}
                        value={editModal[`last_name_${lang}`]}
                        onChange={(e) => updateField(`last_name_${lang}`, e.target.value)}
                        required={lang === 'ru'}
                      />
                      <AdminFormField
                        label={`Имя (${lang.toUpperCase()})`}
                        name={`first_name_${lang}`}
                        value={editModal[`first_name_${lang}`]}
                        onChange={(e) => updateField(`first_name_${lang}`, e.target.value)}
                        required={lang === 'ru'}
                      />
                      <AdminFormField
                        label={`Отчество (${lang.toUpperCase()})`}
                        name={`patronymic_${lang}`}
                        value={editModal[`patronymic_${lang}`]}
                        onChange={(e) => updateField(`patronymic_${lang}`, e.target.value)}
                      />
                    </div>
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Степень (${lang.toUpperCase()})`}
                      name={`degree_${lang}`}
                      value={editModal[`degree_${lang}`]}
                      onChange={(e) => updateField(`degree_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Место работы (${lang.toUpperCase()})`}
                      name={`workplace_${lang}`}
                      value={editModal[`workplace_${lang}`]}
                      onChange={(e) => updateField(`workplace_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <LangTabs>
                  {(lang) => (
                    <AdminFormField
                      label={`Тема доклада (${lang.toUpperCase()})`}
                      name={`topic_${lang}`}
                      value={editModal[`topic_${lang}`]}
                      onChange={(e) => updateField(`topic_${lang}`, e.target.value)}
                    />
                  )}
                </LangTabs>
                <AdminFormField
                  label="Секция"
                  name="section_id"
                  type="select"
                  value={editModal.section_id || ''}
                  onChange={(e) => updateField('section_id', e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Без секции' },
                    ...sections.map(s => ({ value: s.id, label: s.title_ru })),
                  ]}
                />
                <div className="grid grid-cols-3 gap-4">
                  <AdminFormField
                    label="Время начала"
                    name="time_start"
                    type="time"
                    value={editModal.time_start || ''}
                    onChange={(e) => updateField('time_start', e.target.value)}
                  />
                  <AdminFormField
                    label="Время окончания"
                    name="time_end"
                    type="time"
                    value={editModal.time_end || ''}
                    onChange={(e) => updateField('time_end', e.target.value)}
                  />
                  <AdminFormField
                    label="Порядок"
                    name="order"
                    type="number"
                    value={editModal.order}
                    onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                  />
                </div>
                <AdminFormField
                  label="Активен"
                  name="is_active"
                  type="checkbox"
                  value={editModal.is_active}
                  onChange={(e) => updateField('is_active', e.target.value)}
                />
              </>
            )}
          </AdminForm>
        )}
      </AdminModal>

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION                                                   */}
      {/* ===================================================================== */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить запись?"
        message={`Вы уверены, что хотите удалить "${getDeleteName()}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default CongressAdmin;
