import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import Profile from '../Profile';
import { contentAPI } from '../../services/api';
import { createTestI18n } from '../../test/i18n-test-utils';

// userEvent-сценарии: в полном прогоне под нагрузкой 5 с по умолчанию не хватает
vi.setConfig({ testTimeout: 15000 });

// ---------------------------------------------------------------------------
// Личный кабинет (К-12): учётная запись и «Мои сертификаты»
// ---------------------------------------------------------------------------
const auth = vi.hoisted(() => ({ value: { user: null, loading: false } }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => auth.value,
}));

// Хелперы разбора — настоящие, сеть — моки
vi.mock('../../services/api', async (importOriginal) => {
  const real = await importOriginal();
  return {
    readBlobError: real.readBlobError,
    filenameFromDisposition: real.filenameFromDisposition,
    contentAPI: {
      getMyCertificates: vi.fn(),
      downloadMyCertificate: vi.fn(),
    },
  };
});

const USER = {
  id: 3, email: 'aliev@example.com', full_name: 'Алиев Али Валиевич', short_name: 'Али Валиевич', role: 'user',
};

// В схеме `MyCertificate` названия конгресса — `str` без `Optional`, а в модели
// `Congress` колонки `title_*` объявлены `nullable=False`: непереведённое название
// приходит пустой строкой, а не `null`.
const CERT = {
  recipient_id: 41, congress_id: 7,
  congress_title_ru: 'III Конгресс ревматологов', congress_title_uz: 'III Revmatologlar kongressi', congress_title_en: '',
  full_name: 'Алиев Али Валиевич', number: 1, downloads_left: 4, open: true, opens_on: null,
};

const LoginStub = () => {
  const location = useLocation();
  return <h1>Вход (заглушка) from={location.state?.from}</h1>;
};

const renderPage = ({ lng = 'ru' } = {}) =>
  render(
    <I18nextProvider i18n={createTestI18n(lng)}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

const blobError = (status, detail) => ({
  response: { status, data: new Blob([JSON.stringify({ detail })], { type: 'application/json' }) },
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.value = { user: USER, loading: false };
  contentAPI.getMyCertificates.mockResolvedValue({ data: [CERT] });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Profile — вход', () => {
  it('без входа — на /login с возвратом на /profile, сертификаты не запрашиваем', async () => {
    auth.value = { user: null, loading: false };
    renderPage();
    expect(await screen.findByText('Вход (заглушка) from=/profile')).toBeInTheDocument();
    expect(contentAPI.getMyCertificates).not.toHaveBeenCalled();
  });

  it('пока проверяется токен — не уводим', () => {
    auth.value = { user: null, loading: true };
    renderPage();
    expect(screen.queryByText(/Вход \(заглушка\)/)).not.toBeInTheDocument();
  });

  it('показывает Ф.И.О. и email учётной записи', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Личный кабинет' })).toBeInTheDocument();
    expect(screen.getByText('aliev@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Алиев Али Валиевич').length).toBeGreaterThan(0);
  });
});

describe('Profile — карточка сертификата', () => {
  const card = async (title = 'III Конгресс ревматологов') =>
    (await screen.findByRole('heading', { name: title })).closest('li');

  it('открыто — название конгресса, Ф.И.О., номер, «осталось N из 5», кнопка', async () => {
    renderPage();
    const item = await card();
    expect(within(item).getByText('Алиев Али Валиевич')).toBeInTheDocument();
    expect(within(item).getByText('No. 001')).toBeInTheDocument();
    expect(within(item).getByText('Осталось скачиваний: 4 из 5')).toBeInTheDocument();
    expect(within(item).getByRole('button', { name: 'Скачать сертификат' })).toBeEnabled();
  });

  it('закрыто с opens_on — «Будет доступен с ДД.ММ.ГГГГ», кнопки нет', async () => {
    contentAPI.getMyCertificates.mockResolvedValue({ data: [{ ...CERT, open: false, opens_on: '2026-09-26' }] });
    renderPage();
    const item = await card();
    expect(within(item).getByText('Будет доступен с 26.09.2026')).toBeInTheDocument();
    expect(within(item).queryByRole('button')).not.toBeInTheDocument();
  });

  it('закрыто без даты — «Выдача пока не открыта»', async () => {
    contentAPI.getMyCertificates.mockResolvedValue({ data: [{ ...CERT, open: false, opens_on: null }] });
    renderPage();
    const item = await card();
    expect(within(item).getByText('Выдача пока не открыта')).toBeInTheDocument();
    expect(within(item).queryByRole('button')).not.toBeInTheDocument();
  });

  it('название на языке интерфейса, без перевода — русское', async () => {
    renderPage({ lng: 'uz' });
    expect(await screen.findByRole('heading', { name: 'III Revmatologlar kongressi' })).toBeInTheDocument();
  });

  it('английское название пустое — русское', async () => {
    renderPage({ lng: 'en' });
    expect(await screen.findByRole('heading', { name: 'III Конгресс ревматологов' })).toBeInTheDocument();
  });

  it('пустой список — подсказка про email регистрации', async () => {
    contentAPI.getMyCertificates.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/Сертификаты привязаны к email, указанному при регистрации на конгресс/)).toBeInTheDocument();
  });

  it('список не загрузился — сообщение об ошибке', async () => {
    contentAPI.getMyCertificates.mockRejectedValue({ response: { status: 500 } });
    renderPage();
    expect(await screen.findByText('Не удалось загрузить сертификаты. Попробуйте позже.')).toBeInTheDocument();
  });
});

describe('Profile — скачивание', () => {
  it('PDF скачивается с именем из заголовка, остаток уменьшается', async () => {
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    contentAPI.downloadMyCertificate.mockResolvedValue({
      data: pdf,
      headers: { 'content-disposition': 'attachment; filename="Certificate_Aliev_Ali.pdf"' },
    });
    const createObjectURL = vi.fn(() => 'blob:cert');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() { clicked.push(this); });

    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Скачать сертификат' }));

    expect(contentAPI.downloadMyCertificate).toHaveBeenCalledWith(41);
    await vi.waitFor(() => expect(clicked).toHaveLength(1));
    expect(createObjectURL).toHaveBeenCalledWith(pdf);
    expect(clicked[0]).toHaveAttribute('download', 'Certificate_Aliev_Ali.pdf');
    expect(await screen.findByText('Осталось скачиваний: 3 из 5')).toBeInTheDocument();
  });

  it('скачиваний не осталось — кнопка недоступна', async () => {
    contentAPI.getMyCertificates.mockResolvedValue({ data: [{ ...CERT, downloads_left: 0 }] });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Скачать сертификат' })).toBeDisabled();
  });

  it.each([
    [403, 'limit_reached', 'Достигнуто максимальное количество скачиваний сертификата.'],
    [429, 'too_many_requests', 'Слишком много попыток, подождите минуту'],
    [404, 'not_found', 'Сертификат сейчас недоступен. Обновите страницу.'],
  ])('%i — своё сообщение', async (status, detail, text) => {
    contentAPI.downloadMyCertificate.mockRejectedValue(blobError(status, detail));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Скачать сертификат' }));
    expect(await screen.findByText(text)).toBeInTheDocument();
  });
});
