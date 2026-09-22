import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../components/admin';
import { MemoryRouter } from 'react-router-dom';
import CertificatesTab from '../congress/CertificatesTab';
import CongressAdmin from '../CongressAdmin';

// userEvent-сценарии: в полном прогоне под нагрузкой 5 с по умолчанию не хватает
vi.setConfig({ testTimeout: 15000 });

// ---------------------------------------------------------------------------
// Вкладка «Сертификаты» (К-11): настройки шаблона, импорт CSV, список получателей
// ---------------------------------------------------------------------------
const { contentAPI } = vi.hoisted(() => {
  const ok = (data) => Promise.resolve({ data });
  const contentAPI = {
    getCertificateSettings: vi.fn(() => ok({
      congress_id: 1, has_template: true, pdf_filename: 'blank.pdf',
      box_x_mm: 40, box_y_mm: 90, box_w_mm: 217, box_h_mm: 25,
      font_max_pt: 40, font_min_pt: 16, text_color: '#1F2937', is_open: false, updated_at: null,
    })),
    updateCertificateSettings: vi.fn((id, data) => ok({ congress_id: id, has_template: true, pdf_filename: 'blank.pdf', ...data })),
    uploadCertificateTemplate: vi.fn(),
    previewCertificate: vi.fn(),
    getCertificateRecipients: vi.fn(() => ok({
      items: [
        { id: 11, full_name: 'Алиев Али', phone_digits: '998901112233', download_count: 3, created_at: '2026-09-22T10:00:00' },
        { id: 12, full_name: 'Karimov Bobur', phone_digits: null, download_count: 5, created_at: '2026-09-22T10:00:00' },
      ],
      total: 2,
    })),
    createCertificateRecipient: vi.fn(),
    updateCertificateRecipient: vi.fn(),
    deleteCertificateRecipient: vi.fn(() => ok({ ok: true })),
    resetCertificateRecipient: vi.fn((rid) => ok({ id: rid, full_name: 'Karimov Bobur', phone_digits: null, download_count: 0 })),
    importCertificateRecipients: vi.fn(),

    // для подключения вкладки в CongressAdmin
    getCongresses: vi.fn(() => ok([{ id: 1, title_ru: 'Конгресс LEAR 2026', is_active: true }])),
    getCongressSponsors: vi.fn(() => ok([])),
    getCongressProgramDays: vi.fn(() => ok([])),
    getCongressProgramSections: vi.fn(() => ok([])),
    getCongressProgramSectionsByCongress: vi.fn(() => ok([])),
    getCongressSpeakers: vi.fn(() => ok([])),
    getCongressRegistrations: vi.fn(() => ok([])),
  };
  return { contentAPI };
});

vi.mock('../../../services/api', async (importOriginal) => {
  const real = await importOriginal();
  return { contentAPI, readBlobError: real.readBlobError };
});

const REPORT = {
  accepted: 298, will_insert: 294, empty_rows: 2, duplicates_in_file: 1, skipped_existing: 4, inserted: 0,
  short_phones: 0, invalid_phones: 0, too_long_names: 0,
  sample: ['Алиев Али', 'Karimov Bobur'], columns: ['ФИО', 'Телефон'],
};

const renderTab = () =>
  render(
    <ToastProvider>
      <CertificatesTab congressId={1} />
    </ToastProvider>
  );

const csv = () => new File(['ФИО;Телефон\nАлиев Али;+998 90 111 22 33\n'], 'list.csv', { type: 'text/csv' });

const importInput = () => document.querySelector('input[type="file"][accept*=".csv"]');
const templateInput = () => document.querySelector('input[type="file"][accept*="pdf"]');

// Размер задаём свойством: настоящие 20 МБ в памяти теста не нужны
const pdfOfSize = (size) => {
  const file = new File(['%PDF'], 'blank.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const chooseCsv = async () => {
  await screen.findByText('Алиев Али');
  fireEvent.change(importInput(), { target: { files: [csv()] } });
};

beforeEach(() => {
  vi.clearAllMocks();
  contentAPI.importCertificateRecipients.mockImplementation((id, file, { dryRun }) =>
    Promise.resolve({ data: { ...REPORT, inserted: dryRun ? 0 : 298 } }));
});

describe('CertificatesTab — список получателей', () => {
  it('показывает Ф.И.О., телефон и «N из 5»', async () => {
    renderTab();
    const row = (await screen.findByText('Алиев Али')).closest('tr');
    expect(within(row).getByText('998901112233')).toBeInTheDocument();
    expect(within(row).getByText('3 из 5')).toBeInTheDocument();
    expect(contentAPI.getCertificateRecipients).toHaveBeenCalledWith(1, expect.objectContaining({ skip: 0 }));
  });

  it('сброс счётчика вызывает reset и обновляет строку', async () => {
    const user = userEvent.setup();
    renderTab();
    const row = (await screen.findByText('Karimov Bobur')).closest('tr');
    expect(within(row).getByText('5 из 5')).toBeInTheDocument();

    await user.click(within(row).getByTitle('Сбросить счётчик'));
    expect(contentAPI.resetCertificateRecipient).toHaveBeenCalledWith(12);
    expect(await within(row).findByText('0 из 5')).toBeInTheDocument();
  });
});

describe('CertificatesTab — импорт CSV', () => {
  it('«Проверить» — dry_run со сводкой, в базу ничего не пишется', async () => {
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();

    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(contentAPI.importCertificateRecipients).toHaveBeenCalledTimes(1);
    expect(contentAPI.importCertificateRecipients).toHaveBeenCalledWith(1, expect.any(File), { mode: 'append', dryRun: true });

    const summary = await screen.findByTestId('import-summary');
    expect(summary).toHaveTextContent('Будет добавлено: 294');
    expect(summary).not.toHaveTextContent('Будет принято');
    expect(summary).toHaveTextContent('Пустых строк: 2');
    expect(summary).toHaveTextContent('Дублей в файле: 1');
    expect(summary).toHaveTextContent('Уже есть в списке: 4');
    expect(summary).toHaveTextContent('Алиев Али');

    // записи не было: ни второго вызова, ни перезагрузки списка
    expect(contentAPI.importCertificateRecipients).not.toHaveBeenCalledWith(1, expect.anything(), expect.objectContaining({ dryRun: false }));
    expect(contentAPI.getCertificateRecipients).toHaveBeenCalledTimes(1);
  });

  it('«Загрузить» без проверки недоступна; после проверки — пишет', async () => {
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('import-summary');
    await user.click(screen.getByRole('button', { name: 'Загрузить' }));

    expect(contentAPI.importCertificateRecipients).toHaveBeenLastCalledWith(1, expect.any(File), { mode: 'append', dryRun: false });
    // список перечитан
    await vi.waitFor(() => expect(contentAPI.getCertificateRecipients).toHaveBeenCalledTimes(2));
  });

  it('«заменить всех» без подтверждения не уходит', async () => {
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    await user.selectOptions(screen.getByLabelText('Режим'), 'replace');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(contentAPI.importCertificateRecipients).toHaveBeenLastCalledWith(1, expect.any(File), { mode: 'replace', dryRun: true });
    await screen.findByTestId('import-summary');

    await user.click(screen.getByRole('button', { name: 'Загрузить' }));
    expect(await screen.findByText(/Все получатели будут удалены, счётчики скачиваний обнулятся/)).toBeInTheDocument();
    expect(contentAPI.importCertificateRecipients).toHaveBeenCalledTimes(1);

    // отмена — записи нет
    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(contentAPI.importCertificateRecipients).toHaveBeenCalledTimes(1);

    // подтверждение — уходит replace без dry_run
    await user.click(screen.getByRole('button', { name: 'Загрузить' }));
    await user.click(screen.getByRole('button', { name: 'Заменить всех' }));
    expect(contentAPI.importCertificateRecipients).toHaveBeenLastCalledWith(1, expect.any(File), { mode: 'replace', dryRun: false });
  });

  it('смена режима после проверки требует проверить заново', async () => {
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('import-summary');

    await user.selectOptions(screen.getByLabelText('Режим'), 'replace');
    expect(screen.queryByTestId('import-summary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeDisabled();
  });

  it('нет колонки имени — показывает найденные заголовки', async () => {
    contentAPI.importCertificateRecipients.mockRejectedValue({
      response: { status: 400, data: { detail: { code: 'no_name_column', columns: ['Город', 'Возраст'] } } },
    });
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByText(/Не найдена колонка с Ф\.И\.О\..*Город, Возраст/)).toBeInTheDocument();
  });
});

describe('CertificatesTab — сводка проверки', () => {
  const check = async (user, report, mode = 'append') => {
    contentAPI.importCertificateRecipients.mockResolvedValue({ data: { ...REPORT, ...report } });
    renderTab();
    await chooseCsv();
    if (mode !== 'append') await user.selectOptions(screen.getByLabelText('Режим'), mode);
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    return screen.findByTestId('import-summary');
  };

  it('нулевые счётчики телефонов и длинных имён не показывает', async () => {
    const summary = await check(userEvent.setup(), {});
    expect(summary).not.toHaveTextContent(/не распознан/i);
    expect(summary).not.toHaveTextContent('слишком длинное');
  });

  it('нераспознанные телефоны и длинные Ф.И.О. — отдельными строками', async () => {
    const summary = await check(userEvent.setup(), { short_phones: 2, invalid_phones: 1, too_long_names: 4 });
    expect(summary).toHaveTextContent(/Телефон не распознан: 3 — участник будет искаться только по Ф\.И\.О\./);
    expect(summary).toHaveTextContent('Пропущено: слишком длинное Ф.И.О. — 4');
  });

  it('добавлять нечего (will_insert 0) — «Загрузить» недоступна', async () => {
    await check(userEvent.setup(), { will_insert: 0 });
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeDisabled();
  });

  it('замена без принятых строк — «Загрузить» недоступна', async () => {
    await check(userEvent.setup(), { accepted: 0, will_insert: 0 }, 'replace');
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeDisabled();
  });

  it('замена смотрит на accepted, а не на will_insert', async () => {
    await check(userEvent.setup(), { accepted: 10, will_insert: 0 }, 'replace');
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeEnabled();
  });
});

describe('CertificatesTab — ошибки сервера', () => {
  const nginx413 = {
    message: 'Request failed with status code 413',
    response: { status: 413, data: '<html>413 Request Entity Too Large</html>' },
  };

  it('empty_replace — список не заменён', async () => {
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    await user.selectOptions(screen.getByLabelText('Режим'), 'replace');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('import-summary');
    contentAPI.importCertificateRecipients.mockRejectedValue({ response: { status: 400, data: { detail: 'empty_replace' } } });
    await user.click(screen.getByRole('button', { name: 'Загрузить' }));
    await user.click(screen.getByRole('button', { name: 'Заменить всех' }));
    expect(await screen.findByText(/В файле нет ни одной строки — список не заменён/)).toBeInTheDocument();
  });

  it('413 от nginx без JSON — «Файл слишком большой» (импорт)', async () => {
    contentAPI.importCertificateRecipients.mockRejectedValue(nginx413);
    const user = userEvent.setup();
    renderTab();
    await chooseCsv();
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByText('Ошибка импорта: Файл слишком большой')).toBeInTheDocument();
  });

  it('413 от nginx без JSON — «Файл слишком большой» (шаблон)', async () => {
    contentAPI.uploadCertificateTemplate.mockRejectedValue(nginx413);
    renderTab();
    await screen.findByText('Алиев Али');
    fireEvent.change(templateInput(), { target: { files: [pdfOfSize(1024)] } });
    expect(await screen.findByText('Шаблон не загружен: Файл слишком большой')).toBeInTheDocument();
  });

  it('font_min_gt_max — понятный текст', async () => {
    contentAPI.updateCertificateSettings.mockRejectedValueOnce({ response: { status: 422, data: { detail: 'font_min_gt_max' } } });
    const user = userEvent.setup();
    renderTab();
    await user.click(await screen.findByRole('button', { name: 'Сохранить настройки' }));
    expect(await screen.findByText(/Минимальный кегль больше максимального/)).toBeInTheDocument();
  });

  it('422 с массивом detail — «Проверьте значения полей»', async () => {
    contentAPI.updateCertificateSettings.mockRejectedValueOnce({
      response: { status: 422, data: { detail: [{ loc: ['body', 'box_w_mm'], msg: 'Input should be greater than 0', type: 'greater_than' }] } },
    });
    const user = userEvent.setup();
    renderTab();
    await user.click(await screen.findByRole('button', { name: 'Сохранить настройки' }));
    expect(await screen.findByText(/Проверьте значения полей/)).toBeInTheDocument();
  });

  it('invalid_phone при добавлении получателя', async () => {
    contentAPI.createCertificateRecipient.mockRejectedValueOnce({ response: { status: 422, data: { detail: 'invalid_phone' } } });
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('Алиев Али');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    await user.type(screen.getByLabelText(/как на сертификате/), 'Иванов Иван');
    await user.type(screen.getByLabelText('Телефон'), '123');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText(/Телефон: нужно 9–15 цифр или пусто/)).toBeInTheDocument();
  });
});

describe('CertificatesTab — шаблон', () => {
  it('больше 19,5 МБ — не отправляем', async () => {
    renderTab();
    await screen.findByText('Алиев Али');
    fireEvent.change(templateInput(), { target: { files: [pdfOfSize(19.6 * 1024 * 1024)] } });
    expect(await screen.findByText('Файл больше 19,5 МБ')).toBeInTheDocument();
    expect(contentAPI.uploadCertificateTemplate).not.toHaveBeenCalled();
  });

  it('19,4 МБ — отправляем', async () => {
    contentAPI.uploadCertificateTemplate.mockResolvedValueOnce({ data: { has_template: true, pdf_filename: 'new.pdf' } });
    renderTab();
    await screen.findByText('Алиев Али');
    fireEvent.change(templateInput(), { target: { files: [pdfOfSize(19.4 * 1024 * 1024)] } });
    await vi.waitFor(() => expect(contentAPI.uploadCertificateTemplate).toHaveBeenCalledTimes(1));
  });
});

describe('CertificatesTab — пробный PDF', () => {
  const fakeWin = () => ({ location: { href: '' }, close: vi.fn() });

  const askPreview = async (user) => {
    renderTab();
    await user.type(await screen.findByLabelText('Имя для пробы'), 'Иванов Иван');
    await user.click(screen.getByRole('button', { name: 'Пробный PDF' }));
  };

  afterEach(() => vi.restoreAllMocks());

  it('вкладка открывается до запроса, потом получает адрес PDF', async () => {
    const win = fakeWin();
    const order = [];
    vi.spyOn(window, 'open').mockImplementation((...args) => { order.push(['open', ...args]); return win; });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    contentAPI.previewCertificate.mockImplementationOnce(() => {
      order.push(['request']);
      return Promise.resolve({ data: new Blob(['%PDF']) });
    });

    await askPreview(userEvent.setup());
    await vi.waitFor(() => expect(win.location.href).toBe('blob:preview'));
    expect(order).toEqual([['open', '', '_blank'], ['request']]);
    expect(contentAPI.previewCertificate).toHaveBeenCalledWith(1, 'Иванов Иван');
  });

  it('ошибка сборки — вкладка закрывается, тост', async () => {
    const win = fakeWin();
    vi.spyOn(window, 'open').mockReturnValue(win);
    contentAPI.previewCertificate.mockRejectedValueOnce({
      response: { status: 400, data: new Blob([JSON.stringify({ detail: 'no_template' })], { type: 'application/json' }) },
    });

    await askPreview(userEvent.setup());
    expect(await screen.findByText('Пробный PDF не собран: Сначала загрузите шаблон')).toBeInTheDocument();
    expect(win.close).toHaveBeenCalled();
  });

  it('всплывающие окна заблокированы — тост, запроса нет', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    await askPreview(userEvent.setup());
    expect(await screen.findByText(/разрешите всплывающие окна/)).toBeInTheDocument();
    expect(contentAPI.previewCertificate).not.toHaveBeenCalled();
  });
});

describe('CertificatesTab — настройки', () => {
  it('сохраняет рамку, кегль, цвет и «Выдача открыта» числами', async () => {
    const user = userEvent.setup();
    renderTab();
    expect(await screen.findByText(/blank\.pdf/)).toBeInTheDocument();

    const width = screen.getByLabelText('Ширина рамки, мм');
    await user.clear(width);
    await user.type(width, '200.5');
    await user.click(screen.getByLabelText('Выдача открыта'));
    await user.click(screen.getByRole('button', { name: 'Сохранить настройки' }));

    expect(contentAPI.updateCertificateSettings).toHaveBeenCalledWith(1, {
      box_x_mm: 40, box_y_mm: 90, box_w_mm: 200.5, box_h_mm: 25,
      font_max_pt: 40, font_min_pt: 16, text_color: '#1F2937', is_open: true,
    });
  });
});

describe('CongressAdmin — вкладка «Сертификаты»', () => {
  it('открывает вкладку для выбранного конгресса', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <CongressAdmin />
        </ToastProvider>
      </MemoryRouter>
    );
    await screen.findByText('Конгресс LEAR 2026');
    expect(contentAPI.getCertificateSettings).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Сертификаты' }));
    expect(await screen.findByText('Шаблон сертификата')).toBeInTheDocument();
    expect(contentAPI.getCertificateSettings).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Алиев Али')).toBeInTheDocument();
  });
});
