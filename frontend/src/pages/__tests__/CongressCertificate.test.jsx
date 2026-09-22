import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import CongressCertificate from '../CongressCertificate';
import { contentAPI } from '../../services/api';
import { createTestI18n } from '../../test/i18n-test-utils';

// Хелперы разбора — настоящие, сеть — моки
vi.mock('../../services/api', async (importOriginal) => {
  const real = await importOriginal();
  return {
    readBlobError: real.readBlobError,
    filenameFromDisposition: real.filenameFromDisposition,
    contentAPI: {
      getCertificateStatus: vi.fn(),
      suggestCertificateRecipients: vi.fn(),
      issueCertificate: vi.fn(),
    },
  };
});

const ALIEV = { id: 5, full_name: 'Алиев Али Валиевич', needs_phone: true };
const KARIMOV = { id: 6, full_name: 'Каримов Бобур', needs_phone: false };

const renderPage = ({ lng = 'ru' } = {}) =>
  render(
    <I18nextProvider i18n={createTestI18n(lng)}>
      <MemoryRouter initialEntries={['/congress/7/certificate']}>
        <Routes>
          <Route path="/congress/:id/certificate" element={<CongressCertificate />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

const blobError = (status, detail) => ({
  response: { status, data: new Blob([JSON.stringify({ detail })], { type: 'application/json' }) },
});

const nameInput = () => screen.getByRole('combobox', { name: 'Ф.И.О.' });
const findButton = () => screen.getByRole('button', { name: 'Найти сертификат' });

// Ввод Ф.И.О. и выбор участника из подсказок
const pick = async (user, typed, person) => {
  await user.type(await screen.findByRole('combobox', { name: 'Ф.И.О.' }), typed);
  await user.click(await screen.findByRole('option', { name: person.full_name }));
};

beforeEach(() => {
  vi.clearAllMocks();
  contentAPI.getCertificateStatus.mockResolvedValue({ data: { open: true } });
  contentAPI.suggestCertificateRecipients.mockResolvedValue({ data: [ALIEV, KARIMOV] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CongressCertificate — подсказки', () => {
  it('2 символа — не спрашиваем; 3 — спрашиваем после задержки 300 мс', async () => {
    vi.useFakeTimers();
    renderPage();
    await act(async () => { await Promise.resolve(); });
    expect(contentAPI.getCertificateStatus).toHaveBeenCalledWith(7);

    fireEvent.change(nameInput(), { target: { value: 'Ал' } });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(contentAPI.suggestCertificateRecipients).not.toHaveBeenCalled();

    // пробелы не считаются
    fireEvent.change(nameInput(), { target: { value: ' А л ' } });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(contentAPI.suggestCertificateRecipients).not.toHaveBeenCalled();

    fireEvent.change(nameInput(), { target: { value: 'Али' } });
    await act(async () => { vi.advanceTimersByTime(299); });
    expect(contentAPI.suggestCertificateRecipients).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(contentAPI.suggestCertificateRecipients).toHaveBeenCalledTimes(1);
    expect(contentAPI.suggestCertificateRecipients).toHaveBeenCalledWith(7, 'Али');
  });

  it('в списке только имена, без телефонов', async () => {
    contentAPI.suggestCertificateRecipients.mockResolvedValue({
      // даже если сервер ошибочно пришлёт телефон — на экран он не попадает
      data: [{ ...ALIEV, phone_digits: '998901234567' }],
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByRole('combobox', { name: 'Ф.И.О.' }), 'Али');
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['Алиев Али Валиевич']);
    expect(listbox.textContent).not.toMatch(/\d/);
    expect(nameInput()).toHaveAttribute('aria-expanded', 'true');
  });

  it('клавиатура: ↓ и Enter выбирают, Esc закрывает список', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByRole('combobox', { name: 'Ф.И.О.' }), 'Али');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: KARIMOV.full_name })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');

    expect(nameInput()).toHaveValue(KARIMOV.full_name);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(findButton()).toBeEnabled();
    expect(contentAPI.issueCertificate).not.toHaveBeenCalled();
  });

  it('ничего не нашлось — «Совпадений не найдено»', async () => {
    contentAPI.suggestCertificateRecipients.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByRole('combobox', { name: 'Ф.И.О.' }), 'Иванов');
    expect(await screen.findByText('Совпадений не найдено')).toBeInTheDocument();
  });
});

describe('CongressCertificate — выбор и телефон', () => {
  it('кнопка неактивна до выбора; правка текста снимает выбор', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByRole('combobox', { name: 'Ф.И.О.' }), 'Каримов Бобур');
    // своё имя без выбора из списка не отправить
    expect(findButton()).toBeDisabled();

    await user.click(await screen.findByRole('option', { name: KARIMOV.full_name }));
    expect(findButton()).toBeEnabled();

    await user.type(nameInput(), 'x');
    expect(findButton()).toBeDisabled();
  });

  it('needs_phone: true — поле телефона, кнопка ждёт номер; телефон уходит в issue', async () => {
    contentAPI.issueCertificate.mockResolvedValue({ data: new Blob(['%PDF']), headers: {} });
    const user = userEvent.setup();
    renderPage();

    await pick(user, 'Али', ALIEV);
    const phone = screen.getByLabelText('Номер телефона');
    expect(phone).toHaveAttribute('inputmode', 'tel');
    expect(findButton()).toBeDisabled();

    await user.type(phone, '+998 90 123 45 67');
    await user.click(findButton());
    expect(contentAPI.issueCertificate).toHaveBeenCalledWith(7, { recipient_id: 5, phone: '+998 90 123 45 67' });
  });

  it('needs_phone: false — поля телефона нет, phone: null', async () => {
    contentAPI.issueCertificate.mockResolvedValue({ data: new Blob(['%PDF']), headers: {} });
    const user = userEvent.setup();
    renderPage();

    await pick(user, 'Кар', KARIMOV);
    expect(screen.queryByLabelText('Номер телефона')).not.toBeInTheDocument();

    await user.click(findButton());
    expect(contentAPI.issueCertificate).toHaveBeenCalledWith(7, { recipient_id: 6, phone: null });
  });
});

describe('CongressCertificate — ответы выдачи', () => {
  it.each([
    [404, 'not_found', 'Участник с указанными данными не найден. Пожалуйста, проверьте правильность введённых данных.'],
    [403, 'limit_reached', 'Достигнуто максимальное количество скачиваний сертификата.'],
    [429, 'too_many_requests', 'Слишком много попыток, подождите минуту'],
  ])('%i — своё сообщение', async (status, detail, text) => {
    contentAPI.issueCertificate.mockRejectedValue(blobError(status, detail));
    const user = userEvent.setup();
    renderPage();

    await pick(user, 'Кар', KARIMOV);
    await user.click(findButton());
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скачать сертификат' })).not.toBeInTheDocument();
  });

  it('успех — «Скачать сертификат» отдаёт блоб по ссылке с именем из заголовка, без повторного запроса', async () => {
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    contentAPI.issueCertificate.mockResolvedValue({
      data: pdf,
      headers: { 'content-disposition': "attachment; filename=\"Certificate_Karimov_Bobur.pdf\"; filename*=UTF-8''x.pdf" },
    });
    const createObjectURL = vi.fn(() => 'blob:cert');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() { clicked.push(this); });

    const user = userEvent.setup();
    renderPage();
    await pick(user, 'Кар', KARIMOV);
    await user.click(findButton());

    const download = await screen.findByRole('button', { name: 'Скачать сертификат' });
    await user.click(download);
    await user.click(download);

    expect(contentAPI.issueCertificate).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(pdf);
    expect(clicked).toHaveLength(2);
    expect(clicked[0]).toHaveAttribute('download', 'Certificate_Karimov_Bobur.pdf');
    expect(clicked[0]).toHaveAttribute('href', 'blob:cert');
    vi.unstubAllGlobals();
  });

  it('нет Content-Disposition — имя Certificate.pdf', async () => {
    contentAPI.issueCertificate.mockResolvedValue({ data: new Blob(['%PDF']), headers: {} });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }));
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() { clicked.push(this); });

    const user = userEvent.setup();
    renderPage();
    await pick(user, 'Кар', KARIMOV);
    await user.click(findButton());
    await user.click(await screen.findByRole('button', { name: 'Скачать сертификат' }));

    expect(clicked[0]).toHaveAttribute('download', 'Certificate.pdf');
    vi.unstubAllGlobals();
  });
});

describe('CongressCertificate — выдача закрыта', () => {
  it('open: false — сообщение, формы нет', async () => {
    contentAPI.getCertificateStatus.mockResolvedValue({ data: { open: false } });
    renderPage();

    expect(await screen.findByText('Выдача сертификатов пока не открыта')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Найти сертификат' })).not.toBeInTheDocument();
  });

  it('на узбекском — латиница', async () => {
    renderPage({ lng: 'uz' });
    expect(await screen.findByRole('heading', { name: 'Ishtirokchi sertifikatini olish' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'F.I.Sh.' })).toBeInTheDocument();
  });
});
