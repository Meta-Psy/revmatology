import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    getCertificateStatus: vi.fn(),
  },
  getImageUrl: (path) => path,
}));

const CONGRESS = {
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

beforeEach(() => {
  vi.clearAllMocks();
  contentAPI.getHeroImages.mockResolvedValue({ data: [] });
  contentAPI.getCongresses.mockResolvedValue({ data: [CONGRESS] });
  contentAPI.getCongressDetail.mockResolvedValue({ data: CONGRESS });
});

describe('Congress — ссылка «Получить сертификат»', () => {
  it('выдача открыта — ссылка рядом с программой', async () => {
    contentAPI.getCertificateStatus.mockResolvedValue({ data: { open: true } });
    renderCongress();

    await screen.findByRole('link', { name: 'Открыть программу' });
    expect(await screen.findByRole('link', { name: 'Получить сертификат' }))
      .toHaveAttribute('href', '/congress/1/certificate');
    expect(contentAPI.getCertificateStatus).toHaveBeenCalledWith(1);
  }, 15000);

  it('на узбекском — свой текст', async () => {
    contentAPI.getCertificateStatus.mockResolvedValue({ data: { open: true } });
    renderCongress({ lng: 'uz' });

    expect(await screen.findByRole('link', { name: 'Sertifikat olish' }))
      .toHaveAttribute('href', '/congress/1/certificate');
  }, 15000);

  it('выдача закрыта — ссылки нет', async () => {
    contentAPI.getCertificateStatus.mockResolvedValue({ data: { open: false } });
    renderCongress();

    await screen.findByRole('link', { name: 'Открыть программу' });
    // ответ статуса успевает прийти: ждём его, а не угадываем
    await vi.waitFor(() => expect(contentAPI.getCertificateStatus).toHaveBeenCalled());
    await Promise.resolve();
    expect(screen.queryByRole('link', { name: 'Получить сертификат' })).not.toBeInTheDocument();
  }, 15000);

  it('ошибка запроса статуса — ссылки нет, страница на месте', async () => {
    contentAPI.getCertificateStatus.mockRejectedValue(new Error('500'));
    renderCongress();

    await screen.findByRole('link', { name: 'Открыть программу' });
    await vi.waitFor(() => expect(contentAPI.getCertificateStatus).toHaveBeenCalled());
    await Promise.resolve();
    expect(screen.queryByRole('link', { name: 'Получить сертификат' })).not.toBeInTheDocument();
    expect(screen.getAllByText('III Конгресс ревматологов').length).toBeGreaterThan(0);
  }, 15000);
});
