import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../components/admin';
import CongressAdmin from '../CongressAdmin';

// ---------------------------------------------------------------------------
// Вкладка «Конкурс» и строка состояния страниц PDF в форме конгресса (К-08)
// ---------------------------------------------------------------------------
const { store, contentAPI } = vi.hoisted(() => {
  const store = { congresses: [] };
  const ok = (data) => Promise.resolve({ data });

  const contentAPI = {
    getCongresses: vi.fn(() => ok([...store.congresses])),
    createCongress: vi.fn((data) => ok({ id: 2, ...data })),
    updateCongress: vi.fn((id, data) => ok({ id, ...data })),
    deleteCongress: vi.fn(() => ok({})),

    getCongressSponsors: vi.fn(() => ok([])),
    getCongressProgramDays: vi.fn(() => ok([])),
    getCongressProgramSections: vi.fn(() => ok([])),
    getCongressProgramSectionsByCongress: vi.fn(() => ok([])),
    getCongressSpeakers: vi.fn(() => ok([])),
    getCongressRegistrations: vi.fn(() => ok([])),

    uploadFile: vi.fn(),
  };

  return { store, contentAPI };
});

vi.mock('../../../services/api', () => ({ contentAPI }));

// Статичные файлы страниц (§4): что есть в таблице — 200, остальное — 404
let files = {};
const fetchMock = vi.fn(async (url) => (url in files
  ? { ok: true, status: 200, json: async () => files[url] }
  : { ok: false, status: 404, json: async () => ({}) }));

const manifest = (count) => ({
  version: 1,
  source: 'x.pdf',
  page_count: count,
  rendered: count,
  truncated: false,
  widths: [800, 1600],
  pages: Array.from({ length: count }, (_, i) => ({ n: i + 1, w: 1600, h: 2263 })),
  outline: [],
});

const CONGRESS = { id: 1, title_ru: 'Конгресс LEAR 2026', is_active: true, registration_open: true };

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <CongressAdmin />
      </ToastProvider>
    </MemoryRouter>
  );

const pdf = (name = 'polozhenie.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });
const fileInput = () => document.querySelector('input[type="file"]');

const openEditForm = async (user) => {
  const row = (await screen.findByText(CONGRESS.title_ru)).closest('tr');
  await user.click(within(row).getByTitle('Редактировать'));
};
const openFormTab = (user, label) => user.click(screen.getByRole('button', { name: label }));
const save = (user) => user.click(screen.getByRole('button', { name: 'Сохранить' }));

beforeEach(() => {
  store.congresses = [{ ...CONGRESS }];
  files = {};
  vi.clearAllMocks();
  contentAPI.uploadFile.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CongressAdmin — вкладка «Конкурс»', () => {
  it('текст конкурса по языкам переехал сюда и сохраняется', async () => {
    store.congresses = [{ ...CONGRESS, young_scientists_ru: 'Старые условия' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    const ru = screen.getByLabelText(/^Текст конкурса \(RU\)/);
    expect(ru).toHaveValue('Старые условия');
    await user.clear(ru);
    await user.type(ru, 'Новые условия');

    await user.click(screen.getByRole('button', { name: 'UZ' }));
    await user.type(screen.getByLabelText(/^Текст конкурса \(UZ\)/), 'Shartlar');

    await save(user);
    expect(contentAPI.updateCongress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ young_scientists_ru: 'Новые условия', young_scientists_uz: 'Shartlar' })
    );
  }, 30000);

  it('во вкладке «Вкладки» текста конкурса больше нет', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Вкладки');

    expect(screen.getByText('О конгрессе')).toBeInTheDocument();
    expect(screen.getByText('Организаторы')).toBeInTheDocument();
    expect(screen.queryByText('Конкурс молодых ученых')).not.toBeInTheDocument();
    expect(document.querySelector('[name^="young_scientists"]')).toBeNull();
  }, 30000);

  it('PDF положения по языкам уходит в young_scientists_file_*', async () => {
    contentAPI.uploadFile
      .mockResolvedValueOnce({ data: { url: '/uploads/ys-ru.pdf' } })
      .mockResolvedValueOnce({ data: { url: '/uploads/ys-en.pdf' } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    expect(fileInput()).toHaveAttribute('accept', '.pdf');
    expect(screen.getByText(/PDF, до 20 МБ/)).toBeInTheDocument();
    await user.upload(fileInput(), pdf('ru.pdf'));
    expect(await screen.findByRole('link', { name: /ys-ru\.pdf/ })).toHaveAttribute('href', '/uploads/ys-ru.pdf');
    // новый файл ещё не сохранён — рисовать сервер начнёт после сохранения
    expect(screen.getByText('Страницы для просмотра на сайте подготовятся после сохранения')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Файл не загружен')).toBeInTheDocument();
    await user.upload(fileInput(), pdf('en.pdf'));
    await screen.findByRole('link', { name: /ys-en\.pdf/ });

    await save(user);
    const payload = contentAPI.updateCongress.mock.calls[0][1];
    expect(payload.young_scientists_file_ru).toBe('/uploads/ys-ru.pdf');
    expect(payload.young_scientists_file_en).toBe('/uploads/ys-en.pdf');
    expect(payload.young_scientists_file_uz).toBeFalsy();
  }, 30000);

  it('новый конгресс отправляет young_scientists_file_* (пустые, пока файлов нет)', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await user.click(await screen.findByRole('button', { name: /Добавить конгресс/ }));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'Новый конгресс');
    await save(user);

    expect(contentAPI.createCongress).toHaveBeenCalledWith(expect.objectContaining({
      title_ru: 'Новый конгресс',
      young_scientists_file_ru: '',
      young_scientists_file_uz: '',
      young_scientists_file_en: '',
      young_scientists_ru: '',
    }));
  }, 30000);
});

describe('CongressAdmin — состояние страниц сохранённого PDF', () => {
  it('manifest.json есть → «Страницы готовы — N стр.»', async () => {
    store.congresses = [{ ...CONGRESS, young_scientists_file_ru: '/uploads/ys.pdf' }];
    files['/uploads/ys.pages/manifest.json'] = manifest(12);
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    expect(await screen.findByText('Страницы готовы — 12 стр.')).toBeInTheDocument();
  }, 30000);

  it('.pages.error.json есть → «Ошибка: <message>»', async () => {
    store.congresses = [{ ...CONGRESS, young_scientists_file_ru: '/uploads/ys.pdf' }];
    files['/uploads/ys.pages.error.json'] = {
      version: 1, source: 'ys.pdf', error: 'encrypted', message: 'Файл защищён паролем',
    };
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    expect(await screen.findByText('Ошибка: Файл защищён паролем')).toBeInTheDocument();
  }, 30000);

  it('ничего нет → «Готовятся…»', async () => {
    store.congresses = [{ ...CONGRESS, young_scientists_file_ru: '/uploads/ys.pdf' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    expect(await screen.findByText('Готовятся…')).toBeInTheDocument();
  }, 30000);

  it('внешняя ссылка — строки состояния нет', async () => {
    store.congresses = [{ ...CONGRESS, young_scientists_file_ru: 'https://example.com/ys.pdf' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Конкурс');

    expect(screen.getByRole('link', { name: /ys\.pdf/ })).toHaveAttribute('href', 'https://example.com/ys.pdf');
    expect(screen.queryByText(/Страницы|Готовятся|Ошибка:/)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  }, 30000);

  it('во вкладке «Программа» — такая же строка', async () => {
    store.congresses = [{ ...CONGRESS, program_file_ru: '/uploads/program.pdf' }];
    files['/uploads/program.pages/manifest.json'] = manifest(3);
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    expect(await screen.findByText('Страницы готовы — 3 стр.')).toBeInTheDocument();
  }, 30000);

  it('у инфо-письма страниц нет — и строки нет', async () => {
    store.congresses = [{ ...CONGRESS, info_letter_file_ru: '/uploads/letter.pdf' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Инфо-письмо');

    expect(screen.getByRole('link', { name: /letter\.pdf/ })).toBeInTheDocument();
    expect(screen.queryByText(/Готовятся|Страницы/)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  }, 30000);
});
