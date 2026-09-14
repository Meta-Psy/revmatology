import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import Congress from '../Congress';
import { contentAPI } from '../../services/api';
import { createTestI18n } from '../../test/i18n-test-utils';

vi.mock('../../services/api', () => ({
  contentAPI: {
    getCongresses: vi.fn(),
    getCongressDetail: vi.fn(),
    getHeroImages: vi.fn(),
  },
  getImageUrl: (path) => path,
}));

const baseCongress = {
  id: 1,
  title_ru: 'III Конгресс ревматологов',
  date_start: '2026-09-25T09:00:00',
  date_end: '2026-09-26T18:00:00',
  is_active: true,
  registration_open: true,
  sponsors: [],
  speakers: [],
  program_days: [],
};

const renderCongress = ({ lng = 'ru' } = {}) =>
  render(
    <I18nextProvider i18n={createTestI18n(lng)}>
      <MemoryRouter initialEntries={['/congress/1']}>
        <Routes>
          <Route path="/congress/:id" element={<Congress />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

const mockCongress = (data) => {
  contentAPI.getCongresses.mockResolvedValue({ data: [data] });
  contentAPI.getCongressDetail.mockResolvedValue({ data });
};

// Страница тяжёлая: ищем по тексту, а не по роли (урок Т-06)
const openTab = async (label) => fireEvent.click(await screen.findByText(label));

const regulationsLink = (label = 'Положение конкурса') => screen.queryByText(label)?.closest('a') ?? null;

beforeEach(() => {
  vi.clearAllMocks();
  contentAPI.getHeroImages.mockResolvedValue({ data: [] });
});

describe('Congress — вкладка «Конкурс молодых учёных»', () => {
  it('текст как раньше и ссылка «Положение конкурса» на страницу конкурса', async () => {
    mockCongress({
      ...baseCongress,
      young_scientists_ru: 'Условия участия',
      young_scientists_file_ru: '/uploads/ys-ru.pdf',
    });
    renderCongress();
    await openTab('Конкурс молодых ученых');

    expect(await screen.findByText('Условия участия')).toBeInTheDocument();
    expect(regulationsLink()).toHaveAttribute('href', '/congress/1/young-scientists');
  }, 15000);

  it('без файла — только текст, ссылки нет', async () => {
    mockCongress({ ...baseCongress, young_scientists_ru: 'Условия участия' });
    renderCongress();
    await openTab('Конкурс молодых ученых');

    expect(await screen.findByText('Условия участия')).toBeInTheDocument();
    expect(regulationsLink()).toBeNull();
  }, 15000);

  it('только файл — ссылка есть, «добавим позже» нет', async () => {
    mockCongress({ ...baseCongress, young_scientists_file_ru: '/uploads/ys-ru.pdf' });
    renderCongress();
    await openTab('Конкурс молодых ученых');

    expect((await screen.findByText('Положение конкурса')).closest('a')).toHaveAttribute('href', '/congress/1/young-scientists');
    expect(screen.queryByText('Информация будет добавлена позже')).not.toBeInTheDocument();
  }, 15000);

  it('ни текста, ни файла — «Информация будет добавлена позже»', async () => {
    mockCongress({ ...baseCongress });
    renderCongress();
    await openTab('Конкурс молодых ученых');

    expect(await screen.findByText('Информация будет добавлена позже')).toBeInTheDocument();
    expect(regulationsLink()).toBeNull();
  }, 15000);

  it('на узбекском без своего файла ссылка есть (файл RU)', async () => {
    mockCongress({
      ...baseCongress,
      young_scientists_ru: 'Условия участия',
      young_scientists_file_ru: '/uploads/ys-ru.pdf',
      young_scientists_file_uz: '',
    });
    renderCongress({ lng: 'uz' });
    await openTab('Yosh olimlar tanlovi');

    expect((await screen.findByText('Tanlov nizomi')).closest('a')).toHaveAttribute('href', '/congress/1/young-scientists');
    expect(screen.getByText('Условия участия')).toBeInTheDocument();
  }, 15000);
});
