import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  accepted: 298, empty_rows: 2, duplicates_in_file: 1, skipped_existing: 4, inserted: 0,
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
    expect(summary).toHaveTextContent('Будет принято: 298');
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
