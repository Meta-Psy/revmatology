import { useState, useEffect, useRef } from 'react';
import { Plus, Award, RotateCcw, FileText } from 'lucide-react';
import { contentAPI, readBlobError } from '../../../services/api';
import {
  AdminTable, AdminModal, ConfirmDialog, AdminForm, AdminFormField, FileUpload, Skeleton, useToast,
} from '../../../components/admin';

// ---------------------------------------------------------------------------
// Сертификаты участников конгресса (К-11): шаблон, рамки имени и номера,
// импорт CSV, список получателей с номерами и счётчиками выдач
// ---------------------------------------------------------------------------

// Лимит выдач на участника — константа сервера, здесь только для «N из 5»
const MAX_DOWNLOADS = 5;
// nginx client_max_body_size 20M — на весь запрос, запас под multipart
const MAX_TEMPLATE_MB = 19.5;
const MAX_TEMPLATE_LABEL = '19,5';
const PAGE_SIZE = 50;

const NUMBER_FIELDS = [
  { key: 'box_x_mm', label: 'Отступ слева, мм' },
  { key: 'box_y_mm', label: 'Отступ сверху, мм' },
  { key: 'box_w_mm', label: 'Ширина рамки, мм' },
  { key: 'box_h_mm', label: 'Высота рамки, мм' },
  { key: 'font_max_pt', label: 'Кегль максимум, pt' },
  { key: 'font_min_pt', label: 'Кегль минимум, pt' },
  { key: 'number_font_pt', label: 'Кегль номера, pt' },
];

// Рамка номера: все четыре пусто — номер не печатается (сервер хранит null)
const NUMBER_BOX_FIELDS = [
  { key: 'number_box_x_mm', label: 'Номер: слева, мм' },
  { key: 'number_box_y_mm', label: 'Номер: сверху, мм' },
  { key: 'number_box_w_mm', label: 'Номер: ширина, мм' },
  { key: 'number_box_h_mm', label: 'Номер: высота, мм' },
];

// Номер на сертификате — с ведущими нулями до трёх знаков, как в PDF
const formatNumber = (n) => (n == null ? '—' : String(n).padStart(3, '0'));

const IMPORT_MODES = [
  { value: 'append', label: 'Добавить к списку' },
  { value: 'replace', label: 'Заменить всех' },
];

const ERROR_TEXT = {
  not_pdf: 'Файл не похож на PDF',
  too_large: `Файл больше ${MAX_TEMPLATE_LABEL} МБ`,
  no_template: 'Сначала загрузите шаблон',
  font_min_gt_max: 'Минимальный кегль больше максимального',
  empty_replace: 'В файле нет ни одной строки — список не заменён',
  invalid_phone: 'Телефон: нужно 9–15 цифр или пусто',
  number_box_incomplete: 'Рамка номера: заполните все четыре поля или оставьте пустыми',
  number_conflict: 'Номер сертификата уже занят — повторите',
  validation: 'Проверьте значения полей',
  entity_too_large: 'Файл слишком большой',
};

// detail бывает строкой, объектом {code, ...} или массивом ошибок pydantic (422).
// 413 от nginx приходит HTML-страницей, без JSON.
const errCode = (err) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return 'validation';
  if (detail?.code) return detail.code;
  if (err?.response?.status === 413) return 'entity_too_large';
  return undefined;
};

const codeText = (code, err) => ERROR_TEXT[code] || code || err?.message || 'неизвестная ошибка';

const errText = (err) => codeText(errCode(err), err);

const toForm = (s) => ({
  ...Object.fromEntries([...NUMBER_FIELDS, ...NUMBER_BOX_FIELDS].map(({ key }) => [key, s?.[key] == null ? '' : String(s[key])])),
  text_color: s?.text_color || '#1B3A7A',
  is_open: !!s?.is_open,
});

const EMPTY_RECIPIENT = { full_name: '', phone: '' };

const cardClass = 'bg-white border border-slate-200 rounded-lg p-4';
const buttonClass = 'px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5';
const secondaryButtonClass = 'px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5';

const CertificatesTab = ({ congressId }) => {
  const toast = useToast();

  // --- Настройки и шаблон ---
  const [settings, setSettings] = useState(null);
  const [settingsFailed, setSettingsFailed] = useState(false);
  const [form, setForm] = useState(toForm(null));
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [previewName, setPreviewName] = useState('');
  const [previewing, setPreviewing] = useState(false);

  // --- Импорт ---
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState('append');
  const [report, setReport] = useState(null); // сводка dry_run для текущих файла и режима
  const [importError, setImportError] = useState('');
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // --- Получатели ---
  const [recipients, setRecipients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [editRecipient, setEditRecipient] = useState(null);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const listSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    contentAPI.getCertificateSettings(congressId)
      .then((res) => {
        if (cancelled) return;
        setSettings(res.data);
        setForm(toForm(res.data));
      })
      .catch((err) => {
        if (cancelled) return;
        setSettingsFailed(true);
        toast.error('Ошибка загрузки настроек: ' + errText(err));
      });
    return () => { cancelled = true; };
  }, [congressId]);

  // Весь список постранично: сервер отдаёт до 50 за раз, участников — сотни
  const loadRecipients = async (q = search) => {
    const seq = ++listSeq.current;
    setListLoading(true);
    try {
      const items = [];
      let count = 0;
      for (let skip = 0; ; skip += PAGE_SIZE) {
        const res = await contentAPI.getCertificateRecipients(congressId, { q, skip, limit: PAGE_SIZE });
        const page = res.data?.items || [];
        count = res.data?.total ?? 0;
        items.push(...page);
        if (page.length === 0 || items.length >= count) break;
      }
      if (seq !== listSeq.current) return;
      setRecipients(items);
      setTotal(count);
    } catch (err) {
      if (seq === listSeq.current) toast.error('Ошибка загрузки получателей: ' + errText(err));
    } finally {
      if (seq === listSeq.current) setListLoading(false);
    }
  };

  // Поиск — с задержкой, первая загрузка — сразу
  // toast и loadRecipients в зависимости не берём: useToast отдаёт новый объект на каждый
  // рендер провайдера, и список перечитывался бы после каждого тоста
  useEffect(() => {
    const timer = setTimeout(() => loadRecipients(search), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [congressId, search]);

  // ---------------------------------------------------------------------------
  // НАСТРОЙКИ
  // ---------------------------------------------------------------------------
  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSaveSettings = async () => {
    const payload = {};
    const toNumber = (key) => parseFloat(String(form[key]).replace(',', '.'));
    for (const { key, label } of NUMBER_FIELDS) {
      const n = toNumber(key);
      if (!Number.isFinite(n)) {
        toast.error(`Проверьте поле «${label}»`);
        return;
      }
      payload[key] = n;
    }
    const filled = NUMBER_BOX_FIELDS.filter(({ key }) => String(form[key]).trim() !== '');
    if (filled.length !== 0 && filled.length !== NUMBER_BOX_FIELDS.length) {
      toast.error(ERROR_TEXT.number_box_incomplete);
      return;
    }
    for (const { key, label } of NUMBER_BOX_FIELDS) {
      if (filled.length === 0) {
        payload[key] = null;
        continue;
      }
      const n = toNumber(key);
      if (!Number.isFinite(n)) {
        toast.error(`Проверьте поле «${label}»`);
        return;
      }
      payload[key] = n;
    }
    payload.text_color = form.text_color;
    payload.is_open = form.is_open;

    setSavingSettings(true);
    try {
      const res = await contentAPI.updateCertificateSettings(congressId, payload);
      setSettings(res.data);
      setForm(toForm(res.data));
      toast.success('Настройки сохранены');
    } catch (err) {
      toast.error('Ошибка сохранения: ' + errText(err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTemplate = async (file) => {
    if (!file) return;
    if (file.size > MAX_TEMPLATE_MB * 1024 * 1024) {
      toast.error(ERROR_TEXT.too_large);
      return;
    }
    setUploadingTemplate(true);
    try {
      const res = await contentAPI.uploadCertificateTemplate(congressId, file);
      setSettings(res.data);
      toast.success('Шаблон загружен');
    } catch (err) {
      toast.error('Шаблон не загружен: ' + errText(err));
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handlePreview = async () => {
    // Вкладку открываем синхронно по клику: после await браузер счёл бы её всплывающим окном
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Браузер заблокировал новую вкладку — разрешите всплывающие окна');
      return;
    }
    setPreviewing(true);
    try {
      const res = await contentAPI.previewCertificate(congressId, previewName.trim());
      const url = URL.createObjectURL(res.data);
      win.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      win.close();
      const code = (await readBlobError(err)) || errCode(err);
      toast.error('Пробный PDF не собран: ' + codeText(code, err));
    } finally {
      setPreviewing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ИМПОРТ
  // ---------------------------------------------------------------------------
  const importErrorText = (err) => {
    const detail = err?.response?.data?.detail;
    if (errCode(err) === 'no_name_column') {
      const cols = Array.isArray(detail?.columns) ? detail.columns.join(', ') : '';
      return `Не найдена колонка с Ф.И.О. (ФИО, full_name или Фамилия/Имя/Отчество). Найдены: ${cols || '—'}`;
    }
    return 'Ошибка импорта: ' + errText(err);
  };

  const resetReport = () => {
    setReport(null);
    setImportError('');
  };

  const handleCheck = async () => {
    setChecking(true);
    resetReport();
    try {
      const res = await contentAPI.importCertificateRecipients(congressId, importFile, { mode: importMode, dryRun: true });
      setReport(res.data);
    } catch (err) {
      setImportError(importErrorText(err));
    } finally {
      setChecking(false);
    }
  };

  const doImport = async () => {
    setImporting(true);
    try {
      const res = await contentAPI.importCertificateRecipients(congressId, importFile, { mode: importMode, dryRun: false });
      toast.success(`Загружено получателей: ${res.data?.inserted ?? 0}`);
      setImportFile(null);
      resetReport();
      await loadRecipients();
    } catch (err) {
      setImportError(importErrorText(err));
    } finally {
      setImporting(false);
      setConfirmReplace(false);
    }
  };

  // Замена смотрит на принятые строки (пустой файл сервер отклонит), добавление — на то, что реально вставится
  const canImport = !!report && (importMode === 'replace' ? report.accepted > 0 : report.will_insert !== 0);
  const badPhones = (report?.short_phones || 0) + (report?.invalid_phones || 0);

  const handleImport = () => {
    // Замена стирает всех получателей со счётчиками — только через подтверждение
    if (importMode === 'replace') setConfirmReplace(true);
    else doImport();
  };

  // ---------------------------------------------------------------------------
  // ПОЛУЧАТЕЛИ
  // ---------------------------------------------------------------------------
  const handleSaveRecipient = async () => {
    const { id, full_name, phone } = editRecipient;
    const data = { full_name: full_name.trim(), phone: phone.trim() || null };
    if (!data.full_name) {
      toast.error('Укажите Ф.И.О.');
      return;
    }
    setSavingRecipient(true);
    try {
      if (id) await contentAPI.updateCertificateRecipient(id, data);
      else await contentAPI.createCertificateRecipient(congressId, data);
      toast.success(id ? 'Запись обновлена' : 'Получатель добавлен');
      setEditRecipient(null);
      await loadRecipients();
    } catch (err) {
      toast.error('Ошибка сохранения: ' + errText(err));
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleReset = async (row) => {
    try {
      const res = await contentAPI.resetCertificateRecipient(row.id);
      setRecipients((list) => list.map((r) => (r.id === row.id ? { ...r, ...res.data } : r)));
      toast.success('Счётчик сброшен');
    } catch (err) {
      toast.error('Ошибка сброса: ' + errText(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await contentAPI.deleteCertificateRecipient(deleteTarget.id);
      toast.success('Получатель удалён');
      setDeleteTarget(null);
      await loadRecipients();
    } catch (err) {
      toast.error('Ошибка удаления: ' + errText(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'number', label: '№', render: formatNumber },
    { key: 'full_name', label: 'Ф.И.О.' },
    { key: 'phone_digits', label: 'Телефон', render: (v) => v || '—' },
    { key: 'download_count', label: 'Выдано', render: (v) => `${v ?? 0} из ${MAX_DOWNLOADS}` },
  ];

  if (settingsFailed) return <p className="text-sm text-red-600">Настройки сертификатов не загрузились — обновите страницу</p>;
  if (!settings) return <Skeleton rows={4} cols={3} />;

  return (
    <div className="space-y-5">
      {/* ===== Шаблон и рамка имени ===== */}
      <section className={cardClass}>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Шаблон сертификата</h3>

        <div className="mb-4">
          <p className="text-xs text-slate-600 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {settings.has_template
              ? <>Загружен: <span className="font-medium">{settings.pdf_filename || 'шаблон.pdf'}</span></>
              : 'Шаблон не загружен'}
          </p>
          <FileUpload
            value={null}
            onChange={handleTemplate}
            accept="application/pdf,.pdf"
            preview={false}
          />
          {uploadingTemplate && <p className="text-xs text-slate-500 mt-1">Загрузка шаблона…</p>}
          <p className="text-xs text-slate-400 mt-1">PDF до {MAX_TEMPLATE_LABEL} МБ, имя вписывается на первую страницу</p>
        </div>

        <AdminForm onSubmit={handleSaveSettings} loading={savingSettings} submitText="Сохранить настройки">
          <p className="text-xs text-slate-500">Рамка имени — в миллиметрах от левого верхнего угла первой страницы</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {NUMBER_FIELDS.map(({ key, label }) => (
              <AdminFormField
                key={key}
                label={label}
                name={key}
                type="number"
                value={form[key]}
                onChange={updateField}
              />
            ))}
            <AdminFormField label="Цвет имени и номера" name="text_color">
              <input
                id="text_color"
                type="color"
                name="text_color"
                value={form.text_color}
                onChange={updateField}
                className="h-9 w-16 border border-slate-300 rounded-md bg-white"
              />
            </AdminFormField>
          </div>
          <p className="text-xs text-slate-500">Рамка номера, мм — пусто: номер не печатается</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NUMBER_BOX_FIELDS.map(({ key, label }) => (
              <AdminFormField
                key={key}
                label={label}
                name={key}
                type="number"
                value={form[key]}
                onChange={updateField}
              />
            ))}
          </div>
          <AdminFormField
            label="Выдача открыта"
            name="is_open"
            type="checkbox"
            value={form.is_open}
            onChange={(e) => setForm((f) => ({ ...f, is_open: e.target.value }))}
          />
        </AdminForm>

        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-end gap-3">
          <AdminFormField
            label="Имя для пробы"
            name="preview_name"
            value={previewName}
            onChange={(e) => setPreviewName(e.target.value)}
            placeholder="Абдурахманова Маликахон Шухратжоновна"
            className="flex-1 min-w-[240px]"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={!settings.has_template || !previewName.trim() || previewing}
            className={secondaryButtonClass}
          >
            {previewing ? 'Сборка…' : 'Пробный PDF'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Пробный PDF строится по сохранённым настройкам, с контурами рамок имени и номера (номер 000); счётчики не трогает</p>
      </section>

      {/* ===== Импорт CSV ===== */}
      <section className={cardClass}>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Импорт списка (CSV)</h3>
        <div className="grid md:grid-cols-2 gap-3 items-start">
          <FileUpload
            value={importFile}
            onChange={(file) => { setImportFile(file); resetReport(); }}
            accept=".csv,text/csv"
          />
          <AdminFormField
            label="Режим"
            name="import_mode"
            type="select"
            value={importMode}
            onChange={(e) => { setImportMode(e.target.value); resetReport(); }}
            options={IMPORT_MODES}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Колонки: ФИО (или Фамилия, Имя, Отчество) и Телефон (необязательно)</p>

        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleCheck} disabled={!importFile || checking || importing} className={secondaryButtonClass}>
            {checking ? 'Проверка…' : 'Проверить'}
          </button>
          <button type="button" onClick={handleImport} disabled={!canImport || importing} className={buttonClass}>
            {importing ? 'Загрузка…' : 'Загрузить'}
          </button>
        </div>

        {importError && <p className="text-sm text-red-600 mt-3">{importError}</p>}

        {report && (
          <div data-testid="import-summary" className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 space-y-1">
            <p>Будет добавлено: <b>{report.will_insert}</b></p>
            <p>Пустых строк: {report.empty_rows} · Дублей в файле: {report.duplicates_in_file} · Уже есть в списке: {report.skipped_existing}</p>
            {badPhones > 0 && (
              <p className="text-amber-700">Телефон не распознан: {badPhones} — участник будет искаться только по Ф.И.О.</p>
            )}
            {report.too_long_names > 0 && (
              <p className="text-amber-700">Пропущено: слишком длинное Ф.И.О. — {report.too_long_names}</p>
            )}
            {report.columns?.length > 0 && <p>Колонки: {report.columns.join(', ')}</p>}
            {report.sample?.length > 0 && <p>Пример: {report.sample.join('; ')}</p>}
            {importMode === 'replace' && <p className="text-red-600">Режим замены: текущий список и счётчики будут удалены</p>}
          </div>
        )}
      </section>

      {/* ===== Получатели ===== */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по Ф.И.О."
              aria-label="Поиск по Ф.И.О."
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-slate-500">Всего: {total}</span>
          </div>
          <button type="button" onClick={() => setEditRecipient({ ...EMPTY_RECIPIENT })} className={buttonClass}>
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
        <AdminTable
          columns={columns}
          data={recipients}
          loading={listLoading}
          onEdit={(row) => setEditRecipient({ id: row.id, full_name: row.full_name, phone: row.phone_digits || '' })}
          onDelete={(row) => setDeleteTarget(row)}
          actions={(row) => (
            <button
              type="button"
              onClick={() => handleReset(row)}
              className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Сбросить счётчик"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          emptyIcon={Award}
          emptyTitle={search ? 'Никого не нашлось' : 'Получателей пока нет'}
          emptyDescription={search ? 'Измените запрос' : 'Импортируйте CSV или добавьте получателя вручную'}
        />
      </section>

      <AdminModal
        open={!!editRecipient}
        onClose={() => setEditRecipient(null)}
        title={editRecipient?.id ? 'Редактировать получателя' : 'Добавить получателя'}
      >
        {editRecipient && (
          <AdminForm onSubmit={handleSaveRecipient} loading={savingRecipient} onCancel={() => setEditRecipient(null)}>
            <AdminFormField
              label="Ф.И.О. (как на сертификате)"
              name="recipient_full_name"
              value={editRecipient.full_name}
              onChange={(e) => setEditRecipient((r) => ({ ...r, full_name: e.target.value }))}
              required
            />
            <AdminFormField
              label="Телефон"
              name="recipient_phone"
              type="tel"
              value={editRecipient.phone}
              onChange={(e) => setEditRecipient((r) => ({ ...r, phone: e.target.value }))}
              placeholder="Без телефона — проверка только по Ф.И.О."
            />
          </AdminForm>
        )}
      </AdminModal>

      <ConfirmDialog
        open={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        onConfirm={doImport}
        title="Заменить список получателей"
        message="Все получатели будут удалены, счётчики скачиваний обнулятся. Продолжить?"
        confirmText="Заменить всех"
        loading={importing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Удалить получателя «${deleteTarget?.full_name ?? ''}»? Его счётчик выдач тоже удалится.`}
        loading={deleting}
      />
    </div>
  );
};

export default CertificatesTab;
