import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import CongressProgram from '../CongressProgram';
import { contentAPI } from '../../services/api';
import ru from '../../i18n/locales/ru.json';
import uz from '../../i18n/locales/uz.json';
import en from '../../i18n/locales/en.json';

vi.mock('../../services/api', () => ({
  contentAPI: { getCongressDetail: vi.fn() },
  getImageUrl: (path) => path,
}));

// Тот же способ инициализации, что в src/test/i18n-test-utils.js
// (там файл с JSX под расширением .js, поэтому импортировать его нельзя).
const createTestI18n = (lng = 'ru') => {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources: { ru: { translation: ru }, uz: { translation: uz }, en: { translation: en } },
    lng,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'uz', 'en'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
};

const speaker = (id, overrides = {}) => ({
  id,
  last_name_ru: `Фамилия${id}`,
  first_name_ru: `Имя${id}`,
  patronymic_ru: '',
  degree_ru: 'д.м.н.',
  workplace_ru: `Клиника ${id}`,
  topic_ru: `Доклад ${id}`,
  time_start: '10:00:00',
  time_end: '10:20:00',
  photo_url: null,
  section_id: null,
  is_active: true,
  ...overrides,
});

const baseCongress = {
  id: 1,
  title_ru: 'III Конгресс ревматологов',
  title_uz: 'III Revmatologlar kongressi',
  date_start: '2026-09-25',
  date_end: '2026-09-26',
  program_ru: '',
  info_letter_file_ru: '',
  sponsors: [],
  speakers: [],
  program_days: [],
};

const renderProgram = ({ lng = 'ru' } = {}) => {
  const i18n = createTestI18n(lng);
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/congress/1/program']}>
        <Routes>
          <Route path="/congress/:id/program" element={<CongressProgram />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CongressProgram — структурированная программа', () => {
  const structured = {
    ...baseCongress,
    program_days: [
      {
        id: 1,
        title_ru: 'Первый день',
        title_uz: 'Birinchi kun',
        description_ru: 'Открытие конгресса',
        date: '2026-09-25',
        sections: [
          {
            id: 11,
            title_ru: 'Секция А',
            title_uz: 'A bo\'limi',
            description_ru: 'Ревматоидный артрит',
            speakers: [speaker(101), speaker(102)],
          },
          {
            id: 12,
            title_ru: 'Секция Б',
            title_uz: '',
            description_ru: '',
            speakers: [speaker(103)],
          },
        ],
      },
      {
        id: 2,
        title_ru: 'Второй день',
        title_uz: '',
        description_ru: '',
        date: '2026-09-26',
        sections: [
          {
            id: 21,
            title_ru: 'Секция В',
            title_uz: '',
            description_ru: '',
            speakers: [speaker(201)],
          },
        ],
      },
    ],
    speakers: [speaker(101), speaker(102), speaker(103), speaker(201)],
  };

  it('рисует дни → секции → доклады в исходном порядке (RU)', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: structured });
    const { container } = renderProgram();

    expect(await screen.findByText('Первый день')).toBeInTheDocument();

    const text = container.textContent;
    const order = [
      'Первый день',
      'Секция А',
      'Фамилия101 Имя101',
      'Фамилия102 Имя102',
      'Секция Б',
      'Фамилия103 Имя103',
      'Второй день',
      'Секция В',
      'Фамилия201 Имя201',
    ].map((fragment) => text.indexOf(fragment));

    expect(order.every((idx) => idx >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);

    // время доклада и тема выводятся
    expect(screen.getAllByText('10:00 – 10:20').length).toBe(4);
    expect(screen.getByText('Доклад 101')).toBeInTheDocument();
  });

  it('на узбекском показывает title_uz, а при пустом переводе откатывается на RU', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: structured });
    renderProgram({ lng: 'uz' });

    expect(await screen.findByText('Birinchi kun')).toBeInTheDocument();
    expect(screen.getByText("A bo'limi")).toBeInTheDocument();
    // у второго дня и остальных секций title_uz пуст → RU-фолбэк
    expect(screen.getByText('Второй день')).toBeInTheDocument();
    expect(screen.getByText('Секция Б')).toBeInTheDocument();
    expect(screen.queryByText('Первый день')).not.toBeInTheDocument();
  });
});

describe('CongressProgram — деградация без дней программы', () => {
  it('показывает всех спикеров без секции в блоке «Доклады вне секций»', async () => {
    const speakers = Array.from({ length: 9 }, (_, i) => speaker(i + 1));
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...baseCongress, program_days: [], speakers },
    });
    renderProgram();

    expect(await screen.findByText('Доклады вне секций')).toBeInTheDocument();
    for (let i = 1; i <= 9; i += 1) {
      expect(screen.getByText(`Фамилия${i} Имя${i}`)).toBeInTheDocument();
    }
  });

  it('показывает пустое состояние, когда нет ни дней, ни спикеров, ни текста и файла', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...baseCongress } });
    renderProgram();

    expect(await screen.findByText('Программа будет опубликована позже')).toBeInTheDocument();
  });
});

describe('CongressProgram — файл программы', () => {
  it('рисует ссылку на скачивание, когда задан info_letter_file_ru', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...baseCongress, info_letter_file_ru: '/uploads/program.pdf' },
    });
    renderProgram();

    const link = await screen.findByRole('link', { name: 'Скачать программу (файл)' });
    expect(link).toHaveAttribute('href', '/uploads/program.pdf');
  });

  it('не рисует ссылку на скачивание, когда файла нет', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...baseCongress } });
    renderProgram();

    await screen.findByText('Программа будет опубликована позже');
    expect(screen.queryByRole('link', { name: 'Скачать программу (файл)' })).not.toBeInTheDocument();
  });
});
