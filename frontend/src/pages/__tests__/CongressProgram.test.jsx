import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import CongressProgram from '../CongressProgram';
import { contentAPI } from '../../services/api';
import { createTestI18n } from '../../test/i18n-test-utils';

vi.mock('../../services/api', () => ({
  contentAPI: { getCongressDetail: vi.fn() },
  getImageUrl: (path) => path,
}));

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

/** Сколько раз имя спикера встречается в отрендеренном тексте страницы. */
const countOccurrences = (text, fragment) => text.split(fragment).length - 1;

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
            title_uz: "A bo'limi",
            description_ru: 'Ревматоидный артрит',
            speakers: [speaker(101, { section_id: 11 }), speaker(102, { section_id: 11 })],
          },
          {
            id: 12,
            title_ru: 'Секция Б',
            title_uz: '',
            description_ru: '',
            speakers: [speaker(103, { section_id: 12 })],
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
            speakers: [speaker(201, { section_id: 21 })],
          },
        ],
      },
    ],
    // плоский список дублирует тех же спикеров — так отдаёт API
    speakers: [
      speaker(101, { section_id: 11 }),
      speaker(102, { section_id: 11 }),
      speaker(103, { section_id: 12 }),
      speaker(201, { section_id: 21 }),
    ],
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

    // все спикеры разложены по секциям → блока «вне секций» быть не должно
    expect(screen.queryByText('Доклады вне секций')).not.toBeInTheDocument();

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

  it('в блок «вне секций» попадают только непривязанные спикеры, без дублей', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: {
        ...baseCongress,
        program_days: [
          {
            id: 1,
            title_ru: 'Первый день',
            description_ru: '',
            date: '2026-09-25',
            sections: [
              {
                id: 11,
                title_ru: 'Секция А',
                description_ru: '',
                speakers: [speaker(1, { section_id: 11 }), speaker(2, { section_id: 11 })],
              },
            ],
          },
        ],
        speakers: [
          speaker(1, { section_id: 11 }),
          speaker(2, { section_id: 11 }),
          speaker(3),
          speaker(4),
        ],
      },
    });
    const { container } = renderProgram();

    expect(await screen.findByText('Доклады вне секций')).toBeInTheDocument();

    const text = container.textContent;
    // секционные спикеры показаны ровно один раз — внутри секции
    expect(countOccurrences(text, 'Фамилия1 Имя1')).toBe(1);
    expect(countOccurrences(text, 'Фамилия2 Имя2')).toBe(1);
    // непривязанные — ровно один раз, в блоке «вне секций»
    expect(countOccurrences(text, 'Фамилия3 Имя3')).toBe(1);
    expect(countOccurrences(text, 'Фамилия4 Имя4')).toBe(1);

    const outsideIdx = text.indexOf('Доклады вне секций');
    expect(text.indexOf('Фамилия1 Имя1')).toBeLessThan(outsideIdx);
    expect(text.indexOf('Фамилия2 Имя2')).toBeLessThan(outsideIdx);
    expect(text.indexOf('Фамилия3 Имя3')).toBeGreaterThan(outsideIdx);
    expect(text.indexOf('Фамилия4 Имя4')).toBeGreaterThan(outsideIdx);
  });

  it('показывает пустое состояние, когда нет ни дней, ни спикеров, ни текста и файла', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...baseCongress } });
    renderProgram();

    expect(await screen.findByText('Программа будет опубликована позже')).toBeInTheDocument();
  });
});

describe('CongressProgram — PDF программы', () => {
  // jsdom не реализует matchMedia; подменяем, чтобы проверить широкий и узкий экран
  const mockMatchMedia = (matches) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  };

  afterEach(() => {
    delete window.matchMedia;
  });

  const withPdf = { ...baseCongress, program_file_ru: '/uploads/program-ru.pdf' };

  it('без PDF блока нет', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...baseCongress, speakers: [speaker(1)] },
    });
    renderProgram();

    await screen.findByText('Доклады вне секций');
    expect(screen.queryByText('Программа конгресса (PDF)')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Открыть' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Скачать' })).not.toBeInTheDocument();
  });

  it('рисует кнопки «Открыть» (новая вкладка) и «Скачать» с правильной ссылкой', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: withPdf });
    renderProgram();

    expect(await screen.findByText('Программа конгресса (PDF)')).toBeInTheDocument();

    const open = screen.getByRole('link', { name: 'Открыть' });
    expect(open).toHaveAttribute('href', '/uploads/program-ru.pdf');
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveAttribute('rel', 'noopener noreferrer');

    const download = screen.getByRole('link', { name: 'Скачать' });
    expect(download).toHaveAttribute('href', '/uploads/program-ru.pdf');
    expect(download).toHaveAttribute('download');
  });

  it('страница с одним PDF не показывает «программа будет опубликована позже»', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: withPdf });
    renderProgram();

    await screen.findByText('Программа конгресса (PDF)');
    expect(screen.queryByText('Программа будет опубликована позже')).not.toBeInTheDocument();
  });

  it('на узбекском берёт program_file_uz', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...withPdf, program_file_uz: '/uploads/program-uz.pdf' },
    });
    renderProgram({ lng: 'uz' });

    expect(await screen.findByText('Kongress dasturi (PDF)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ochish' })).toHaveAttribute('href', '/uploads/program-uz.pdf');
  });

  it('на узбекском без program_file_uz откатывается на RU-файл', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...withPdf, program_file_uz: '' } });
    renderProgram({ lng: 'uz' });

    await screen.findByText('Kongress dasturi (PDF)');
    expect(screen.getByRole('link', { name: 'Ochish' })).toHaveAttribute('href', '/uploads/program-ru.pdf');
    expect(screen.getByRole('link', { name: 'Yuklab olish' })).toHaveAttribute('href', '/uploads/program-ru.pdf');
  });

  it('PDF идёт первым блоком, над днями и докладами', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...withPdf, speakers: [speaker(1)] },
    });
    const { container } = renderProgram();

    await screen.findByText('Доклады вне секций');
    const text = container.textContent;
    expect(text.indexOf('Программа конгресса (PDF)')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Программа конгресса (PDF)')).toBeLessThan(text.indexOf('Доклады вне секций'));
  });

  it('на широком экране встраивает PDF с запасной ссылкой внутри', async () => {
    mockMatchMedia(true);
    contentAPI.getCongressDetail.mockResolvedValue({ data: withPdf });
    const { container } = renderProgram();

    await screen.findByText('Программа конгресса (PDF)');
    const viewer = container.querySelector('object[type="application/pdf"]');
    expect(viewer).not.toBeNull();
    expect(viewer).toHaveAttribute('data', '/uploads/program-ru.pdf');
    expect(viewer.querySelector('a')).toHaveAttribute('href', '/uploads/program-ru.pdf');
  });

  it('на узком экране (телефон) встроенного просмотра нет, только кнопки', async () => {
    mockMatchMedia(false);
    contentAPI.getCongressDetail.mockResolvedValue({ data: withPdf });
    const { container } = renderProgram();

    await screen.findByText('Программа конгресса (PDF)');
    expect(container.querySelector('object')).toBeNull();
    expect(screen.getByRole('link', { name: 'Открыть' })).toBeInTheDocument();
  });
});

describe('CongressProgram — файл информационного письма', () => {
  it('рисует ссылку на скачивание, когда задан info_letter_file_ru', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({
      data: { ...baseCongress, info_letter_file_ru: '/uploads/info-letter.pdf' },
    });
    renderProgram();

    const link = await screen.findByRole('link', { name: 'Информационное письмо (файл)' });
    expect(link).toHaveAttribute('href', '/uploads/info-letter.pdf');
  });

  it('не рисует ссылку на скачивание, когда файла нет', async () => {
    contentAPI.getCongressDetail.mockResolvedValue({ data: { ...baseCongress } });
    renderProgram();

    await screen.findByText('Программа будет опубликована позже');
    expect(screen.queryByRole('link', { name: 'Информационное письмо (файл)' })).not.toBeInTheDocument();
  });
});
