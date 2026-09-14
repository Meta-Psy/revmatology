import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  title_uz: 'III Revmatologlar kongressi',
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

beforeEach(() => {
  vi.clearAllMocks();
  contentAPI.getHeroImages.mockResolvedValue({ data: [] });
});

describe('Congress — кнопка «Программа (PDF)»', () => {
  it('появляется рядом со ссылкой на страницу программы и открывает PDF в новой вкладке', async () => {
    mockCongress({ ...baseCongress, program_file_ru: '/uploads/program-ru.pdf' });
    renderCongress();

    // ссылка на страницу программы по-прежнему на месте
    expect(await screen.findByRole('link', { name: 'Открыть программу' })).toHaveAttribute('href', '/congress/1/program');

    const pdf = screen.getByRole('link', { name: 'Программа (PDF)' });
    expect(pdf).toHaveAttribute('href', '/uploads/program-ru.pdf');
    expect(pdf).toHaveAttribute('target', '_blank');
    expect(pdf).toHaveAttribute('rel', 'noopener noreferrer');
  }, 15000);

  it('нет PDF — кнопки нет', async () => {
    mockCongress({ ...baseCongress });
    renderCongress();

    await screen.findByRole('link', { name: 'Открыть программу' });
    expect(screen.queryByRole('link', { name: 'Программа (PDF)' })).not.toBeInTheDocument();
  }, 15000);

  it('на узбекском без своего файла берёт RU-файл', async () => {
    mockCongress({ ...baseCongress, program_file_ru: '/uploads/program-ru.pdf', program_file_uz: '' });
    renderCongress({ lng: 'uz' });

    expect(await screen.findByRole('link', { name: 'Dastur (PDF)' })).toHaveAttribute('href', '/uploads/program-ru.pdf');
  }, 15000);

  it('есть и во вкладке «Программа», где вместо «добавим позже» только PDF', async () => {
    mockCongress({ ...baseCongress, program_file_ru: '/uploads/program-ru.pdf' });
    const user = userEvent.setup();
    renderCongress();

    await user.click(await screen.findByRole('button', { name: 'Программа' }));

    expect(screen.getByRole('link', { name: 'Программа (PDF)' })).toHaveAttribute('href', '/uploads/program-ru.pdf');
    expect(screen.queryByText('Информация будет добавлена позже')).not.toBeInTheDocument();
  }, 15000);
});
