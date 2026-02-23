import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const CongressAdmin = () => {
  const [activeTab, setActiveTab] = useState('congresses');
  const [congresses, setCongresses] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [programDays, setProgramDays] = useState([]);
  const [sections, setSections] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCongressId, setSelectedCongressId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadCongresses(); }, []);
  useEffect(() => { if (selectedCongressId) { loadCongressData(); } }, [selectedCongressId]);
  useEffect(() => { if (selectedDayId) { loadSections(selectedDayId); } }, [selectedDayId]);

  const loadCongresses = async () => {
    try {
      const res = await contentAPI.getCongresses(true);
      setCongresses(res.data || []);
      if (res.data?.length > 0 && !selectedCongressId) setSelectedCongressId(res.data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadCongressData = async () => {
    try {
      const [sp, days, spk, regs] = await Promise.all([
        contentAPI.getCongressSponsors(selectedCongressId, true),
        contentAPI.getCongressProgramDays(selectedCongressId),
        contentAPI.getCongressSpeakers(selectedCongressId, null, true),
        contentAPI.getCongressRegistrations(selectedCongressId).catch(() => ({ data: [] })),
      ]);
      setSponsors(sp.data || []);
      setProgramDays(days.data || []);
      setSpeakers(spk.data || []);
      setRegistrations(regs.data || []);
      if (days.data?.length > 0) { setSelectedDayId(days.data[0].id); }
    } catch (err) { console.error(err); }
  };

  const loadSections = async (dayId) => {
    try {
      const res = await contentAPI.getCongressProgramSections(dayId);
      setSections(res.data || []);
    } catch (err) { console.error(err); }
  };

  // ==================== GENERIC CRUD HELPERS ====================
  const handleSave = async (type, data) => {
    try {
      if (editItem?.id) {
        const { congress_id, day_id, ...updateData } = data;
        const updateFn = {
          congress: contentAPI.updateCongress,
          sponsor: contentAPI.updateCongressSponsor,
          day: contentAPI.updateCongressProgramDay,
          section: contentAPI.updateCongressProgramSection,
          speaker: contentAPI.updateCongressSpeaker,
        }[type];
        await updateFn(editItem.id, updateData);
      } else {
        const createFn = {
          congress: contentAPI.createCongress,
          sponsor: contentAPI.createCongressSponsor,
          day: contentAPI.createCongressProgramDay,
          section: contentAPI.createCongressProgramSection,
          speaker: contentAPI.createCongressSpeaker,
        }[type];
        await createFn(data);
      }
      setShowForm(false);
      setEditItem(null);
      if (type === 'congress') loadCongresses();
      else loadCongressData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Удалить?')) return;
    try {
      const deleteFn = {
        congress: contentAPI.deleteCongress,
        sponsor: contentAPI.deleteCongressSponsor,
        day: contentAPI.deleteCongressProgramDay,
        section: contentAPI.deleteCongressProgramSection,
        speaker: contentAPI.deleteCongressSpeaker,
      }[type];
      await deleteFn(id);
      if (type === 'congress') loadCongresses();
      else loadCongressData();
    } catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
  };

  const openForm = (type, item = null) => {
    setEditItem(item || { _type: type });
    setShowForm(true);
  };

  // ==================== INPUT HELPER ====================
  const Input = ({ label, name, value, onChange, type = 'text', required = false, multiline = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      {multiline ? (
        <textarea name={name} value={value || ''} onChange={onChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
      ) : (
        <input type={type} name={name} value={value || ''} onChange={onChange} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
      )}
    </div>
  );

  // ==================== CONGRESS FORM ====================
  const CongressForm = () => {
    const [form, setForm] = useState(editItem?.id ? { ...editItem } : {
      title_ru: '', title_uz: '', title_en: '', description_ru: '', description_uz: '', description_en: '',
      date_start: '', date_end: '', location_ru: '', location_uz: '', location_en: '', image_url: '',
      is_active: true, registration_open: true,
      about_ru: '', about_uz: '', about_en: '', organizers_ru: '', organizers_uz: '', organizers_en: '',
      young_scientists_ru: '', young_scientists_uz: '', young_scientists_en: '',
      contact_publications_phone: '', contact_publications_email: '',
      contact_registration_phone: '', contact_registration_email: '',
      contact_participation_phone: '', contact_participation_email: '',
      info_letter_ru: '', info_letter_uz: '', info_letter_en: '',
      info_letter_file_ru: '', info_letter_file_uz: '', info_letter_file_en: '',
    });
    const ch = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const [formTab, setFormTab] = useState('basic');
    const formTabs = [
      { key: 'basic', label: 'Основное' }, { key: 'tabs', label: 'Вкладки' },
      { key: 'contacts', label: 'Контакты' }, { key: 'infoLetter', label: 'Инфо-письмо' },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{editItem?.id ? 'Редактировать конгресс' : 'Новый конгресс'}</h2>
        <div className="flex gap-2 mb-4 border-b pb-2">
          {formTabs.map(t => (
            <button key={t.key} onClick={() => setFormTab(t.key)} className={`px-3 py-1.5 text-sm rounded-lg ${formTab === t.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSave('congress', form); }} className="space-y-4">
          {formTab === 'basic' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Название (RU)" name="title_ru" value={form.title_ru} onChange={ch} required />
                <Input label="Название (UZ)" name="title_uz" value={form.title_uz} onChange={ch} required />
                <Input label="Название (EN)" name="title_en" value={form.title_en} onChange={ch} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Описание (RU)" name="description_ru" value={form.description_ru} onChange={ch} multiline />
                <Input label="Описание (UZ)" name="description_uz" value={form.description_uz} onChange={ch} multiline />
                <Input label="Описание (EN)" name="description_en" value={form.description_en} onChange={ch} multiline />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Дата начала" name="date_start" value={form.date_start ? form.date_start.substring(0, 16) : ''} onChange={ch} type="datetime-local" />
                <Input label="Дата окончания" name="date_end" value={form.date_end ? form.date_end.substring(0, 16) : ''} onChange={ch} type="datetime-local" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Место (RU)" name="location_ru" value={form.location_ru} onChange={ch} />
                <Input label="Место (UZ)" name="location_uz" value={form.location_uz} onChange={ch} />
                <Input label="Место (EN)" name="location_en" value={form.location_en} onChange={ch} />
              </div>
              <Input label="URL изображения" name="image_url" value={form.image_url} onChange={ch} />
              <div className="flex gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={ch} className="rounded" /> Активен</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="registration_open" checked={form.registration_open} onChange={ch} className="rounded" /> Регистрация открыта</label>
              </div>
            </>
          )}
          {formTab === 'tabs' && (
            <>
              {['about', 'organizers', 'young_scientists'].map(field => (
                <div key={field}>
                  <h3 className="font-medium text-gray-800 mb-2 capitalize">{field === 'about' ? 'О конгрессе' : field === 'organizers' ? 'Организаторы' : 'Конкурс молодых ученых'}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="RU" name={`${field}_ru`} value={form[`${field}_ru`]} onChange={ch} multiline />
                    <Input label="UZ" name={`${field}_uz`} value={form[`${field}_uz`]} onChange={ch} multiline />
                    <Input label="EN" name={`${field}_en`} value={form[`${field}_en`]} onChange={ch} multiline />
                  </div>
                </div>
              ))}
            </>
          )}
          {formTab === 'contacts' && (
            <div className="space-y-4">
              {[
                { prefix: 'contact_publications', label: 'По вопросам публикаций' },
                { prefix: 'contact_registration', label: 'По вопросам регистрации' },
                { prefix: 'contact_participation', label: 'По вопросам участия' },
              ].map(({ prefix, label }) => (
                <div key={prefix}>
                  <h3 className="font-medium text-gray-800 mb-2">{label}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Телефон" name={`${prefix}_phone`} value={form[`${prefix}_phone`]} onChange={ch} />
                    <Input label="Email" name={`${prefix}_email`} value={form[`${prefix}_email`]} onChange={ch} type="email" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {formTab === 'infoLetter' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Контент (RU)" name="info_letter_ru" value={form.info_letter_ru} onChange={ch} multiline />
                <Input label="Контент (UZ)" name="info_letter_uz" value={form.info_letter_uz} onChange={ch} multiline />
                <Input label="Контент (EN)" name="info_letter_en" value={form.info_letter_en} onChange={ch} multiline />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="PDF файл (RU)" name="info_letter_file_ru" value={form.info_letter_file_ru} onChange={ch} />
                <Input label="PDF файл (UZ)" name="info_letter_file_uz" value={form.info_letter_file_uz} onChange={ch} />
                <Input label="PDF файл (EN)" name="info_letter_file_en" value={form.info_letter_file_en} onChange={ch} />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить</button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== SPONSOR FORM ====================
  const SponsorForm = () => {
    const [form, setForm] = useState(editItem?.id ? { ...editItem } : {
      congress_id: selectedCongressId, name_ru: '', name_uz: '', name_en: '',
      description_ru: '', description_uz: '', description_en: '',
      logo_url: '', website_url: '', order: 0, is_active: true,
    });
    const ch = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{editItem?.id ? 'Редактировать спонсора' : 'Новый спонсор'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave('sponsor', form); }} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Название (RU)" name="name_ru" value={form.name_ru} onChange={ch} required />
            <Input label="Название (UZ)" name="name_uz" value={form.name_uz} onChange={ch} required />
            <Input label="Название (EN)" name="name_en" value={form.name_en} onChange={ch} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Логотип URL" name="logo_url" value={form.logo_url} onChange={ch} />
            <Input label="Сайт URL" name="website_url" value={form.website_url} onChange={ch} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Порядок" name="order" value={form.order} onChange={ch} type="number" />
            <label className="flex items-center gap-2 mt-6"><input type="checkbox" name="is_active" checked={form.is_active} onChange={ch} className="rounded" /> Активен</label>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить</button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== DAY FORM ====================
  const DayForm = () => {
    const [form, setForm] = useState(editItem?.id ? { ...editItem } : {
      congress_id: selectedCongressId, date: '', title_ru: '', title_uz: '', title_en: '',
      description_ru: '', description_uz: '', description_en: '', order: 0,
    });
    const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{editItem?.id ? 'Редактировать день' : 'Новый день'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave('day', form); }} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Название (RU)" name="title_ru" value={form.title_ru} onChange={ch} required />
            <Input label="Название (UZ)" name="title_uz" value={form.title_uz} onChange={ch} required />
            <Input label="Название (EN)" name="title_en" value={form.title_en} onChange={ch} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Дата" name="date" value={form.date || ''} onChange={ch} type="date" />
            <Input label="Порядок" name="order" value={form.order} onChange={ch} type="number" />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить</button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== SECTION FORM ====================
  const SectionForm = () => {
    const [form, setForm] = useState(editItem?.id ? { ...editItem } : {
      day_id: selectedDayId, title_ru: '', title_uz: '', title_en: '',
      description_ru: '', description_uz: '', description_en: '', order: 0,
    });
    const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{editItem?.id ? 'Редактировать секцию' : 'Новая секция'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave('section', form); }} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Название (RU)" name="title_ru" value={form.title_ru} onChange={ch} required />
            <Input label="Название (UZ)" name="title_uz" value={form.title_uz} onChange={ch} required />
            <Input label="Название (EN)" name="title_en" value={form.title_en} onChange={ch} required />
          </div>
          <Input label="Порядок" name="order" value={form.order} onChange={ch} type="number" />
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить</button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== SPEAKER FORM ====================
  const SpeakerForm = () => {
    const [form, setForm] = useState(editItem?.id ? { ...editItem } : {
      congress_id: selectedCongressId, section_id: null,
      last_name_ru: '', last_name_uz: '', last_name_en: '',
      first_name_ru: '', first_name_uz: '', first_name_en: '',
      patronymic_ru: '', patronymic_uz: '', patronymic_en: '',
      degree_ru: '', degree_uz: '', degree_en: '',
      workplace_ru: '', workplace_uz: '', workplace_en: '',
      topic_ru: '', topic_uz: '', topic_en: '',
      time_start: '', time_end: '', photo_url: '', order: 0, is_active: true,
    });
    const ch = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{editItem?.id ? 'Редактировать спикера' : 'Новый спикер'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave('speaker', { ...form, section_id: form.section_id || null }); }} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Фамилия (RU)" name="last_name_ru" value={form.last_name_ru} onChange={ch} required />
            <Input label="Фамилия (UZ)" name="last_name_uz" value={form.last_name_uz} onChange={ch} required />
            <Input label="Фамилия (EN)" name="last_name_en" value={form.last_name_en} onChange={ch} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Имя (RU)" name="first_name_ru" value={form.first_name_ru} onChange={ch} required />
            <Input label="Имя (UZ)" name="first_name_uz" value={form.first_name_uz} onChange={ch} required />
            <Input label="Имя (EN)" name="first_name_en" value={form.first_name_en} onChange={ch} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Отчество (RU)" name="patronymic_ru" value={form.patronymic_ru} onChange={ch} />
            <Input label="Отчество (UZ)" name="patronymic_uz" value={form.patronymic_uz} onChange={ch} />
            <Input label="Отчество (EN)" name="patronymic_en" value={form.patronymic_en} onChange={ch} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Степень (RU)" name="degree_ru" value={form.degree_ru} onChange={ch} />
            <Input label="Степень (UZ)" name="degree_uz" value={form.degree_uz} onChange={ch} />
            <Input label="Степень (EN)" name="degree_en" value={form.degree_en} onChange={ch} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Место работы (RU)" name="workplace_ru" value={form.workplace_ru} onChange={ch} />
            <Input label="Место работы (UZ)" name="workplace_uz" value={form.workplace_uz} onChange={ch} />
            <Input label="Место работы (EN)" name="workplace_en" value={form.workplace_en} onChange={ch} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Тема (RU)" name="topic_ru" value={form.topic_ru} onChange={ch} />
            <Input label="Тема (UZ)" name="topic_uz" value={form.topic_uz} onChange={ch} />
            <Input label="Тема (EN)" name="topic_en" value={form.topic_en} onChange={ch} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Секция</label>
            <select name="section_id" value={form.section_id || ''} onChange={ch} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Без секции</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title_ru}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Время начала" name="time_start" value={form.time_start || ''} onChange={ch} type="time" />
            <Input label="Время окончания" name="time_end" value={form.time_end || ''} onChange={ch} type="time" />
            <Input label="Порядок" name="order" value={form.order} onChange={ch} type="number" />
          </div>
          <Input label="Фото URL" name="photo_url" value={form.photo_url} onChange={ch} />
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={ch} className="rounded" /> Активен</label>
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить</button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== CSV EXPORT ====================
  const exportToCSV = () => {
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

  // ==================== RENDER ====================
  const adminTabs = [
    { key: 'congresses', label: 'Конгрессы' },
    { key: 'sponsors', label: 'Спонсоры' },
    { key: 'program', label: 'Программа' },
    { key: 'speakers', label: 'Спикеры' },
    { key: 'registrations', label: 'Регистрации' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  const renderForm = () => {
    if (!showForm) return null;
    const type = editItem?._type || (activeTab === 'congresses' ? 'congress' : activeTab === 'sponsors' ? 'sponsor' : activeTab === 'speakers' ? 'speaker' : activeTab === 'program' ? (editItem?.day_id !== undefined || editItem?._formType === 'section' ? 'section' : 'day') : null);
    switch (type) {
      case 'congress': return <CongressForm />;
      case 'sponsor': return <SponsorForm />;
      case 'day': return <DayForm />;
      case 'section': return <SectionForm />;
      case 'speaker': return <SpeakerForm />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Управление конгрессами</h1>
        {congresses.length > 1 && (
          <select value={selectedCongressId || ''} onChange={(e) => setSelectedCongressId(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {congresses.map(c => <option key={c.id} value={c.id}>{c.title_ru}</option>)}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {adminTabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowForm(false); setEditItem(null); }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {showForm && renderForm()}

      {!showForm && (
        <>
          {/* ===== CONGRESSES TAB ===== */}
          {activeTab === 'congresses' && (
            <div>
              <div className="mb-4">
                <button onClick={() => openForm('congress')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Новый конгресс</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Даты</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {congresses.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.title_ru}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{c.date_start ? new Date(c.date_start).toLocaleDateString('ru-RU') : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.is_active ? 'Активен' : 'Неактивен'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openForm('congress', c)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Ред.</button>
                          <button onClick={() => handleDelete('congress', c.id)} className="text-red-600 hover:text-red-800 text-sm">Удл.</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {congresses.length === 0 && <div className="text-center py-8 text-gray-500">Конгрессов нет</div>}
              </div>
            </div>
          )}

          {/* ===== SPONSORS TAB ===== */}
          {activeTab === 'sponsors' && (
            <div>
              <div className="mb-4"><button onClick={() => openForm('sponsor')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Новый спонсор</button></div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сайт</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порядок</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sponsors.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name_ru}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.website_url || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.order}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openForm('sponsor', s)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Ред.</button>
                          <button onClick={() => handleDelete('sponsor', s.id)} className="text-red-600 hover:text-red-800 text-sm">Удл.</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sponsors.length === 0 && <div className="text-center py-8 text-gray-500">Спонсоров нет</div>}
              </div>
            </div>
          )}

          {/* ===== PROGRAM TAB ===== */}
          {activeTab === 'program' && (
            <div className="space-y-6">
              {/* Days */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Дни программы</h2>
                  <button onClick={() => openForm('day')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Новый день</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {programDays.map(d => (
                    <div key={d.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${selectedDayId === d.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <button onClick={() => setSelectedDayId(d.id)} className="text-sm font-medium">{d.title_ru}</button>
                      <button onClick={() => openForm('day', d)} className="text-blue-500 hover:text-blue-700 text-xs">ред</button>
                      <button onClick={() => handleDelete('day', d.id)} className="text-red-500 hover:text-red-700 text-xs">x</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              {selectedDayId && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Секции</h2>
                    <button onClick={() => { setEditItem({ _type: 'section', _formType: 'section' }); setShowForm(true); }} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">+ Новая секция</button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порядок</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sections.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.title_ru}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{s.order}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => { setEditItem({ ...s, _type: 'section', _formType: 'section' }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Ред.</button>
                              <button onClick={() => handleDelete('section', s.id)} className="text-red-600 hover:text-red-800 text-sm">Удл.</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sections.length === 0 && <div className="text-center py-8 text-gray-500">Секций нет</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SPEAKERS TAB ===== */}
          {activeTab === 'speakers' && (
            <div>
              <div className="mb-4"><button onClick={() => openForm('speaker')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Новый спикер</button></div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Степень</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тема</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {speakers.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.last_name_ru} {s.first_name_ru} {s.patronymic_ru || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.degree_ru || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.topic_ru || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openForm('speaker', s)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Ред.</button>
                          <button onClick={() => handleDelete('speaker', s.id)} className="text-red-600 hover:text-red-800 text-sm">Удл.</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {speakers.length === 0 && <div className="text-center py-8 text-gray-500">Спикеров нет</div>}
              </div>
            </div>
          )}

          {/* ===== REGISTRATIONS TAB ===== */}
          {activeTab === 'registrations' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500">Всего заявок: {registrations.length}</p>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  CSV
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Контакты</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Организация</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Должность</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registrations.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.last_name} {r.first_name} {r.patronymic || ''}</td>
                          <td className="px-4 py-3"><div className="text-sm text-gray-900">{r.email}</div><div className="text-sm text-gray-500">{r.phone}</div></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{r.organization || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{r.position || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {registrations.length === 0 && <div className="text-center py-8 text-gray-500">Заявок нет</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CongressAdmin;
