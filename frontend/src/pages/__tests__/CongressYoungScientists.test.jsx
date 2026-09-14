import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import CongressYoungScientists from '../CongressYoungScientists';
import { contentAPI } from '../../services/api';
import { createTestI18n } from '../../test/i18n-test-utils';

vi.mock('../../services/api', () => ({
  contentAPI: { getCongressDetail: vi.fn() },
  getImageUrl: (path) => path,
}));

const baseCongress = {
  id: 7,
  title_ru: 'III Конгресс ревматологов',
  title_uz: 'III Revmatologlar kongressi',
  date_start: '2026-09-25',
  date_end: '2026-09-26',
  young_scientists_ru: '',
  young_scientists_uz: '',
  young_scientists_en: '',
  young_scientists_file_ru: '',
  young_scientists_file_uz: '',
  young_scientists_file_en: '',
};

const renderPage = ({ lng = 'ru' } = {}) =>
  render(
    <I18nextProvider i18n={createTestI18n(lng)}>
      <MemoryRouter initialEntries={['/congress/7/young-scientists']}>
        <Routes>
          <Route path="/congress/:id/young-scientists" element={<CongressYoungScientists />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

// Манифестов нет: просмотр показывает кнопки «Открыть PDF» / «Скачать»
const fetchMock = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CongressYoungScientists', () => {
  it('текст положения и просмотр PDF на русском', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: {
        ...baseCongress,
        young_scientists_ru: 'Участвуют авторы до 35 лет.\nТезисы — до 1 сентября.',
        young_scientists_file_ru: '/uploads/ys-ru.pdf',
      },
    });
    const { container } = renderPage();

    expect(await screen.findByText('Конкурс молодых учёных', { selector: 'h1' })).toBeInTheDocument();
    expect(contentAPI.getCongressDetail).toHaveBeenCalledWith(7);
    expect(screen.getByText('III Конгресс ревматологов')).toBeInTheDocument();
    // перевод строки — как во вкладке конгресса
    expect(container.innerHTML).toContain('Участвуют авторы до 35 лет.<br>Тезисы — до 1 сентября.');

    expect(fetchMock).toHaveBeenCalledWith('/uploads/ys-ru.pages/manifest.json', expect.any(Object));
    expect(screen.getByLabelText('Открыть PDF')).toHaveAttribute('href', '/uploads/ys-ru.pdf');
    expect(screen.getByLabelText('Скачать')).toHaveAttribute('download', 'polozhenie-konkursa-7-ru.pdf');

    // хлебные крошки и возврат к конгрессу
    expect(screen.getByText('Вернуться к конгрессу').closest('a')).toHaveAttribute('href', '/congress/7');
    expect(screen.queryByText('Информация будет опубликована позже')).not.toBeInTheDocument();

    // условия — перед положением: на телефоне иначе уходят под 10–20 страниц PDF
    const text = container.textContent;
    expect(text.indexOf('Участвуют авторы до 35 лет.')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Участвуют авторы до 35 лет.')).toBeLessThan(text.indexOf('Положение конкурса (PDF)'));
  });

  it('на узбекском свой файл и текст', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: {
        ...baseCongress,
        young_scientists_ru: 'Русский текст',
        young_scientists_uz: "O'zbekcha matn",
        young_scientists_file_ru: '/uploads/ys-ru.pdf',
        young_scientists_file_uz: '/uploads/ys-uz.pdf',
      },
    });
    renderPage({ lng: 'uz' });

    expect(await screen.findByText("O'zbekcha matn")).toBeInTheDocument();
    expect(screen.queryByText('Русский текст')).not.toBeInTheDocument();
    expect(screen.getByLabelText('PDF ochish')).toHaveAttribute('href', '/uploads/ys-uz.pdf');
    expect(screen.getByLabelText('Yuklab olish')).toHaveAttribute('download', 'polozhenie-konkursa-7-uz.pdf');
  });

  it('на узбекском без перевода — русский текст и русский файл (имя по языку файла)', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: {
        ...baseCongress,
        young_scientists_ru: 'Русский текст',
        young_scientists_file_ru: '/uploads/ys-ru.pdf',
      },
    });
    renderPage({ lng: 'uz' });

    expect(await screen.findByText('Русский текст')).toBeInTheDocument();
    expect(screen.getByLabelText('PDF ochish')).toHaveAttribute('href', '/uploads/ys-ru.pdf');
    expect(screen.getByLabelText('Yuklab olish')).toHaveAttribute('download', 'polozhenie-konkursa-7-ru.pdf');
  });

  it('только файл, без текста — просмотр без «опубликуем позже»', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...baseCongress, young_scientists_file_ru: '/uploads/ys-ru.pdf' },
    });
    renderPage();

    expect(await screen.findByLabelText('Открыть PDF')).toBeInTheDocument();
    expect(screen.queryByText('Информация будет опубликована позже')).not.toBeInTheDocument();
  });

  it('ни текста, ни файла — «Информация будет опубликована позже»', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...baseCongress } });
    renderPage();

    expect(await screen.findByText('Информация будет опубликована позже')).toBeInTheDocument();
    expect(screen.queryByLabelText('Открыть PDF')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('конгресс не найден', async () => {
    contentAPI.getCongressDetail.mockRejectedValue(new Error('404'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPage();

    expect(await screen.findByText('Конгресс не найден')).toBeInTheDocument();
  });
});
