import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../components/admin';
import CongressAdmin from '../CongressAdmin';

// ---------------------------------------------------------------------------
// PDF программы и инфо-письма в форме конгресса (К-07)
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

const CONGRESS = { id: 1, title_ru: 'Конгресс LEAR 2026', is_active: true, registration_open: true };

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <CongressAdmin />
      </ToastProvider>
    </MemoryRouter>
  );

const pdf = (name = 'program.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

// В форме конгресса одновременно виден ровно один FileUpload
const fileInput = () => document.querySelector('input[type="file"]');

const openEditForm = async (user) => {
  const row = (await screen.findByText(CONGRESS.title_ru)).closest('tr');
  await user.click(within(row).getByTitle('Редактировать'));
};

const openFormTab = (user, label) => user.click(screen.getByRole('button', { name: label }));

const save = (user) => user.click(screen.getByRole('button', { name: 'Сохранить' }));

const submitButton = () => document.querySelector('button[type="submit"]');

// Признак загрузки у поля (у кнопки сохранения — тот же текст, поэтому ищем абзац)
const fieldUploading = () => screen.queryByText('Загрузка файла…', { selector: 'p' });

// Загрузка, которую тест завершает сам, когда нужно
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  store.congresses = [{ ...CONGRESS }];
  vi.clearAllMocks();
  // clearAllMocks не чистит очередь mock*Once: несъеденный ответ одного теста
  // иначе достаётся следующему
  contentAPI.uploadFile.mockReset();
});

describe('CongressAdmin — вкладка «Программа» (PDF по языкам)', () => {
  it('загруженный PDF уходит в program_file_ru при сохранении', async () => {
    contentAPI.uploadFile.mockResolvedValueOnce({ data: { url: '/uploads/program-ru.pdf' } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    expect(fileInput()).toHaveAttribute('accept', '.pdf');
    const file = pdf();
    await user.upload(fileInput(), file);

    expect(contentAPI.uploadFile).toHaveBeenCalledWith(file);
    expect(await screen.findByRole('link', { name: /program-ru\.pdf/ })).toHaveAttribute('href', '/uploads/program-ru.pdf');

    await save(user);

    expect(contentAPI.updateCongress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ program_file_ru: '/uploads/program-ru.pdf', title_ru: CONGRESS.title_ru })
    );
  }, 30000);

  it('у каждого языка свой файл', async () => {
    contentAPI.uploadFile
      .mockResolvedValueOnce({ data: { url: '/uploads/program-ru.pdf' } })
      .mockResolvedValueOnce({ data: { url: '/uploads/program-uz.pdf' } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    await user.upload(fileInput(), pdf('ru.pdf'));
    await screen.findByRole('link', { name: /program-ru\.pdf/ });

    await user.click(screen.getByRole('button', { name: 'UZ' }));
    expect(screen.getByText('Файл не загружен')).toBeInTheDocument();
    await user.upload(fileInput(), pdf('uz.pdf'));
    await screen.findByRole('link', { name: /program-uz\.pdf/ });

    await save(user);

    const payload = contentAPI.updateCongress.mock.calls[0][1];
    expect(payload.program_file_ru).toBe('/uploads/program-ru.pdf');
    expect(payload.program_file_uz).toBe('/uploads/program-uz.pdf');
    expect(payload.program_file_en).toBeFalsy();
  }, 30000);

  it('файл можно убрать', async () => {
    store.congresses = [{ ...CONGRESS, program_file_ru: '/uploads/old-program.pdf' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    expect(screen.getByRole('link', { name: /old-program\.pdf/ })).toHaveAttribute('href', '/uploads/old-program.pdf');
    await user.click(screen.getByRole('button', { name: 'Убрать файл' }));
    expect(screen.queryByRole('link', { name: /old-program\.pdf/ })).not.toBeInTheDocument();

    await save(user);

    expect(contentAPI.updateCongress).toHaveBeenCalledWith(1, expect.objectContaining({ program_file_ru: '' }));
  }, 30000);

  it('новый конгресс отправляет program_file_* (пустые, пока файлов нет)', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await user.click(await screen.findByRole('button', { name: /Добавить конгресс/ }));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'Новый конгресс');
    await save(user);

    expect(contentAPI.createCongress).toHaveBeenCalledWith(
      expect.objectContaining({ title_ru: 'Новый конгресс', program_file_ru: '', program_file_uz: '', program_file_en: '' })
    );
  }, 30000);

  it('не PDF не загружается', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    // fireEvent, а не user.upload: тот сам отбрасывает файлы не по accept
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })] } });

    expect(await screen.findByText(/Нужен файл в формате PDF/)).toBeInTheDocument();
    expect(contentAPI.uploadFile).not.toHaveBeenCalled();
  }, 30000);

  it('пока файл грузится, сохранить нельзя', async () => {
    const upload = deferred();
    contentAPI.uploadFile.mockReturnValueOnce(upload.promise);
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');
    await user.upload(fileInput(), pdf());

    expect(fieldUploading()).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveTextContent('Загрузка файла…');

    await act(async () => upload.resolve({ data: { url: '/uploads/program-ru.pdf' } }));
    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeEnabled();
  }, 30000);

  it('две загрузки подряд: «Сохранить» заблокирована, пока идёт вторая', async () => {
    const ru = deferred();
    const uz = deferred();
    contentAPI.uploadFile.mockReturnValueOnce(ru.promise).mockReturnValueOnce(uz.promise);
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');
    await user.upload(fileInput(), pdf('ru.pdf'));
    await user.click(screen.getByRole('button', { name: 'UZ' }));
    await user.upload(fileInput(), pdf('uz.pdf'));

    // RU догрузился раньше UZ
    await act(async () => ru.resolve({ data: { url: '/uploads/program-ru.pdf' } }));
    expect(submitButton()).toBeDisabled();
    expect(fieldUploading()).toBeInTheDocument(); // поле UZ ещё грузится

    // признак загрузки — у своего поля: у RU уже виден файл
    await user.click(screen.getByRole('button', { name: 'RU' }));
    expect(screen.getByRole('link', { name: /program-ru\.pdf/ })).toBeInTheDocument();
    expect(fieldUploading()).toBeNull();

    await act(async () => uz.resolve({ data: { url: '/uploads/program-uz.pdf' } }));
    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeEnabled();

    await save(user);
    expect(contentAPI.updateCongress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ program_file_ru: '/uploads/program-ru.pdf', program_file_uz: '/uploads/program-uz.pdf' })
    );
  }, 30000);

  it('после отказа загрузки «Сохранить» снова активна', async () => {
    contentAPI.uploadFile.mockRejectedValueOnce({ response: { data: { detail: 'сервер недоступен' } } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');
    await user.upload(fileInput(), pdf());

    expect(await screen.findByText(/Ошибка загрузки файла: сервер недоступен/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled();
    expect(fieldUploading()).toBeNull();
  }, 30000);

  it('тот же файл можно выбрать повторно после ошибки загрузки', async () => {
    contentAPI.uploadFile
      .mockRejectedValueOnce({ response: { data: { detail: 'обрыв связи' } } })
      .mockResolvedValueOnce({ data: { url: '/uploads/program-ru.pdf' } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');

    const file = pdf();
    await user.upload(fileInput(), file);
    await screen.findByText(/Ошибка загрузки файла: обрыв связи/);

    await user.upload(fileInput(), file);
    expect(contentAPI.uploadFile).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('link', { name: /program-ru\.pdf/ })).toBeInTheDocument();
  }, 30000);

  it('файл больше 20 МБ не отправляется', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');
    expect(screen.getByText(/PDF, до 20 МБ/)).toBeInTheDocument();

    const big = pdf('big.pdf');
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 });
    await user.upload(fileInput(), big);

    expect(await screen.findByText(/Файл больше 20 МБ/)).toBeInTheDocument();
    expect(contentAPI.uploadFile).not.toHaveBeenCalled();
  }, 30000);
});

describe('CongressAdmin — результат загрузки не попадает в чужую форму', () => {
  it('закрыли модалку во время загрузки — она не всплывает снова', async () => {
    const upload = deferred();
    contentAPI.uploadFile.mockReturnValueOnce(upload.promise);
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Программа');
    await user.upload(fileInput(), pdf());
    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(document.querySelector('form')).toBeNull();

    await act(async () => upload.resolve({ data: { url: '/uploads/program-ru.pdf' } }));

    expect(document.querySelector('form')).toBeNull();
    expect(screen.queryByText('Файл загружен')).not.toBeInTheDocument();
  }, 30000);

  it('закрыли конгресс A, открыли B — файл от A в B не попадает', async () => {
    store.congresses = [{ ...CONGRESS }, { ...CONGRESS, id: 2, title_ru: 'Конгресс B' }];
    const upload = deferred();
    contentAPI.uploadFile.mockReturnValueOnce(upload.promise);
    const user = userEvent.setup();
    renderAdmin();

    // A: начали загрузку и закрыли
    await openEditForm(user);
    await openFormTab(user, 'Программа');
    await user.upload(fileInput(), pdf());
    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    // B: открыли, а загрузка A тем временем закончилась
    const rowB = screen.getByText('Конгресс B').closest('tr');
    await user.click(within(rowB).getByTitle('Редактировать'));
    await act(async () => upload.resolve({ data: { url: '/uploads/program-of-a.pdf' } }));

    await openFormTab(user, 'Программа');
    expect(screen.queryByRole('link', { name: /program-of-a\.pdf/ })).not.toBeInTheDocument();
    expect(screen.getByText('Файл не загружен')).toBeInTheDocument();

    await save(user);
    expect(contentAPI.updateCongress).toHaveBeenCalledTimes(1);
    const [id, payload] = contentAPI.updateCongress.mock.calls[0];
    expect(id).toBe(2);
    expect(payload.program_file_ru).toBeFalsy();
    expect(JSON.stringify(payload)).not.toContain('program-of-a.pdf');
  }, 30000);
});

describe('CongressAdmin — инфо-письмо: загрузка PDF вместо поля URL', () => {
  it('поля «PDF файл URL» больше нет, есть загрузка PDF', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Инфо-письмо');

    expect(screen.queryByPlaceholderText('https://...')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/PDF файл URL/)).not.toBeInTheDocument();
    expect(fileInput()).toHaveAttribute('accept', '.pdf');
    expect(screen.getByText(/PDF, до 20 МБ/)).toBeInTheDocument();
  }, 30000);

  it('ранее сохранённая ссылка показывается и сохраняется как была', async () => {
    store.congresses = [{ ...CONGRESS, info_letter_file_ru: 'https://example.com/files/letter.pdf' }];
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Инфо-письмо');

    expect(screen.getByRole('link', { name: /letter\.pdf/ })).toHaveAttribute('href', 'https://example.com/files/letter.pdf');

    await save(user);

    expect(contentAPI.updateCongress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ info_letter_file_ru: 'https://example.com/files/letter.pdf' })
    );
  }, 30000);

  it('загруженный PDF заменяет ссылку', async () => {
    store.congresses = [{ ...CONGRESS, info_letter_file_ru: 'https://example.com/files/letter.pdf' }];
    contentAPI.uploadFile.mockResolvedValueOnce({ data: { url: '/uploads/info-letter.pdf' } });
    const user = userEvent.setup();
    renderAdmin();

    await openEditForm(user);
    await openFormTab(user, 'Инфо-письмо');
    await user.upload(fileInput(), pdf('letter.pdf'));
    await screen.findByRole('link', { name: /info-letter\.pdf/ });

    await save(user);

    expect(contentAPI.updateCongress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ info_letter_file_ru: '/uploads/info-letter.pdf' })
    );
  }, 30000);
});
