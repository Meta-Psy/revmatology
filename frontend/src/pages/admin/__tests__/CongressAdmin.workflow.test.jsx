import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../components/admin';
import CongressAdmin from '../CongressAdmin';

// ---------------------------------------------------------------------------
// Фейковый API с состоянием: созданное через UI действительно «сохраняется»
// и возвращается следующими запросами — как на живом бэкенде.
// ---------------------------------------------------------------------------
const { store, contentAPI } = vi.hoisted(() => {
  const store = {
    congresses: [{ id: 1, title_ru: 'Конгресс ревматологов 2026', is_active: true, registration_open: true }],
    days: [],
    sections: [],
    speakers: [],
    seq: 100,
  };
  const ok = (data) => Promise.resolve({ data });
  const nextId = () => ++store.seq;

  const contentAPI = {
    // Конгрессы
    getCongresses: vi.fn(() => ok([...store.congresses])),
    createCongress: vi.fn((data) => ok({ id: nextId(), ...data })),
    updateCongress: vi.fn((id, data) => ok({ id, ...data })),
    deleteCongress: vi.fn(() => ok({})),

    // Спонсоры / регистрации — в этом сценарии не участвуют
    getCongressSponsors: vi.fn(() => ok([])),
    createCongressSponsor: vi.fn((data) => ok({ id: nextId(), ...data })),
    updateCongressSponsor: vi.fn((id, data) => ok({ id, ...data })),
    deleteCongressSponsor: vi.fn(() => ok({})),
    getCongressRegistrations: vi.fn(() => ok([])),

    // Дни программы
    getCongressProgramDays: vi.fn((congressId) => ok(store.days.filter(d => d.congress_id === congressId))),
    createCongressProgramDay: vi.fn((data) => {
      const row = { id: nextId(), congress_id: 1, ...data };
      store.days.push(row);
      return ok(row);
    }),
    updateCongressProgramDay: vi.fn((id, data) => {
      const row = store.days.find(d => d.id === id);
      Object.assign(row, data);
      return ok(row);
    }),
    deleteCongressProgramDay: vi.fn((id) => {
      store.days = store.days.filter(d => d.id !== id);
      return ok({});
    }),

    // Секции
    getCongressProgramSections: vi.fn((dayId) => ok(store.sections.filter(s => s.day_id === dayId))),
    getCongressProgramSectionsByCongress: vi.fn((congressId) => {
      const dayIds = store.days.filter(d => d.congress_id === congressId).map(d => d.id);
      return ok(store.sections.filter(s => dayIds.includes(s.day_id)));
    }),
    createCongressProgramSection: vi.fn((data) => {
      const row = { id: nextId(), ...data };
      store.sections.push(row);
      return ok(row);
    }),
    updateCongressProgramSection: vi.fn((id, data) => {
      const row = store.sections.find(s => s.id === id);
      Object.assign(row, data);
      return ok(row);
    }),
    deleteCongressProgramSection: vi.fn((id) => {
      store.sections = store.sections.filter(s => s.id !== id);
      return ok({});
    }),

    // Спикеры
    getCongressSpeakers: vi.fn(() => ok([...store.speakers])),
    createCongressSpeaker: vi.fn((data) => {
      const row = { id: nextId(), ...data };
      store.speakers.push(row);
      return ok(row);
    }),
    updateCongressSpeaker: vi.fn((id, data) => ok({ id, ...data })),
    deleteCongressSpeaker: vi.fn(() => ok({})),

    uploadFile: vi.fn(() => ok({ url: '/uploads/test.jpg' })),
  };

  return { store, contentAPI };
});

vi.mock('../../../services/api', () => ({ contentAPI }));

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <CongressAdmin />
      </ToastProvider>
    </MemoryRouter>
  );

// Кнопки ищем по тексту (getByText + selector: 'button'), а не getByRole.
// В jsdom getComputedStyle после любой мутации DOM стоит десятки мс, а getByRole
// зовёт его для каждого потомка каждой кнопки-кандидата (доступное имя + проверка
// видимости); findByRole вдобавок повторяет запрос на каждую мутацию DOM. По
// профилю на это уходило больше половины времени сценария — тест упирался в
// тайм-аут (Т-06).
const findButton = (text) => screen.findByText(text, { selector: 'button' });

// Проверка pointer-events зовёт getComputedStyle для цели и всех её предков на
// каждое действие. Здесь она ничего не проверяет: в тестах css: false, а
// pointer-events в проекте задаётся только классами Tailwind.
const setupUser = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const openTab = async (user, label) => user.click(await findButton(label));

// Заполнить поле по подписи (тип date не переживает посимвольный ввод)
const setField = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const save = (user) => user.click(screen.getByText('Сохранить', { selector: 'button' }));

// У кнопки «Удалить» в строке таблицы только иконка и title, текст «Удалить»
// есть лишь у кнопки подтверждения в диалоге.
const confirmDelete = async (user) => user.click(await findButton('Удалить'));

const deleteRow = async (user, rowText) => {
  const row = screen.getByText(rowText).closest('tr');
  await user.click(within(row).getByTitle('Удалить'));
  await confirmDelete(user);
};

beforeEach(() => {
  store.congresses = [{ id: 1, title_ru: 'Конгресс ревматологов 2026', is_active: true, registration_open: true }];
  store.days = [];
  store.sections = [];
  store.speakers = [];
  store.seq = 100;
  vi.clearAllMocks();
});

describe('CongressAdmin — сценарий администратора', () => {
  it('день → секции двух дней → спикер, привязанный к секции другого дня', async () => {
    const user = setupUser();
    renderAdmin();

    // --- (a) Два дня программы --------------------------------------------
    await openTab(user, 'Дни программы');

    await user.click(await findButton(/Добавить день/));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'День 1');
    setField('Дата', '2026-09-25');
    await save(user);

    expect(await screen.findByText('День 1')).toBeInTheDocument();
    expect(contentAPI.createCongressProgramDay).toHaveBeenCalledWith(
      expect.objectContaining({ title_ru: 'День 1', date: '2026-09-25', congress_id: 1 })
    );

    await user.click(screen.getByText(/Добавить день/, { selector: 'button' }));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'День 2');
    setField('Дата', '2026-09-26');
    await save(user);

    expect(await screen.findByText('День 2')).toBeInTheDocument();
    const [day1, day2] = store.days;

    // --- (b) Секция первого дня -------------------------------------------
    await openTab(user, 'Секции');
    await user.selectOptions(await screen.findByLabelText('День программы'), String(day1.id));

    await user.click(await findButton(/Добавить секцию/));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'Пленарное заседание');
    await save(user);

    expect(await screen.findByText('Пленарное заседание')).toBeInTheDocument();
    expect(contentAPI.createCongressProgramSection).toHaveBeenLastCalledWith(
      expect.objectContaining({ title_ru: 'Пленарное заседание', day_id: day1.id })
    );

    // --- (c) Секция второго дня -------------------------------------------
    await user.selectOptions(screen.getByLabelText('День программы'), String(day2.id));

    await user.click(await findButton(/Добавить секцию/));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'Постерная сессия');
    await save(user);

    expect(await screen.findByText('Постерная сессия')).toBeInTheDocument();
    expect(contentAPI.createCongressProgramSection).toHaveBeenLastCalledWith(
      expect.objectContaining({ title_ru: 'Постерная сессия', day_id: day2.id })
    );
    // Секция первого дня во вкладке второго дня не показывается
    expect(screen.queryByText('Пленарное заседание')).not.toBeInTheDocument();

    // --- (d) Спикер, привязанный к секции ВТОРОГО дня ----------------------
    await openTab(user, 'Спикеры');
    await user.click(await findButton(/Добавить спикера/));

    await user.type(await screen.findByLabelText(/^Фамилия \(RU\)/), 'Иванов');
    await user.type(screen.getByLabelText(/^Имя \(RU\)/), 'Пётр');

    const sectionSelect = screen.getByLabelText('Секция');
    // В списке — секции обоих дней, сгруппированные по дню
    // (по тексту, а не getByRole('option') — та же причина, что у findButton)
    const option = (text) => within(sectionSelect).getByText(text, { selector: 'option' });
    expect(option('Пленарное заседание')).toBeInTheDocument();
    const posterOption = option('Постерная сессия');
    expect(posterOption.closest('optgroup').label).toContain('День 2');

    await user.selectOptions(sectionSelect, posterOption);
    await save(user);

    const section2 = store.sections.find(s => s.title_ru === 'Постерная сессия');
    expect(contentAPI.createCongressSpeaker).toHaveBeenCalledWith(
      expect.objectContaining({
        last_name_ru: 'Иванов',
        first_name_ru: 'Пётр',
        section_id: section2.id,
        congress_id: 1,
      })
    );
    expect(await screen.findByText(/Иванов Пётр/)).toBeInTheDocument();
  }, 30000);

  it('секцию можно перенести на другой день', async () => {
    store.days = [
      { id: 11, congress_id: 1, title_ru: 'День 1', date: '2026-09-25', order: 0 },
      { id: 12, congress_id: 1, title_ru: 'День 2', date: '2026-09-26', order: 1 },
    ];
    store.sections = [{ id: 21, day_id: 11, title_ru: 'Пленарное заседание', order: 0 }];

    const user = setupUser();
    renderAdmin();

    await openTab(user, 'Секции');
    await user.selectOptions(await screen.findByLabelText('День программы'), '11');
    await user.click(await screen.findByTitle('Редактировать'));

    // В форме редактирования есть выбор дня
    await user.selectOptions(await screen.findByLabelText('День'), '12');
    await save(user);

    expect(contentAPI.updateCongressProgramSection).toHaveBeenCalledWith(
      21,
      expect.objectContaining({ day_id: 12, title_ru: 'Пленарное заседание' })
    );
    // congress_id при обновлении не отправляется
    expect(contentAPI.updateCongressProgramSection.mock.calls[0][1]).not.toHaveProperty('congress_id');
    // Секция уехала на второй день — в первом её больше нет
    expect(await screen.findByText('Секций пока нет')).toBeInTheDocument();
  }, 30000);

  it('выбранный день не сбрасывается на первый после сохранения спикера', async () => {
    store.days = [
      { id: 11, congress_id: 1, title_ru: 'День 1', date: '2026-09-25', order: 0 },
      { id: 12, congress_id: 1, title_ru: 'День 2', date: '2026-09-26', order: 1 },
    ];

    const user = setupUser();
    renderAdmin();

    await openTab(user, 'Секции');
    await user.selectOptions(await screen.findByLabelText('День программы'), '12');

    // Любое действие с другой сущностью перезагружает данные конгресса
    await openTab(user, 'Спикеры');
    await user.click(await findButton(/Добавить спикера/));
    await user.type(await screen.findByLabelText(/^Фамилия \(RU\)/), 'Петров');
    await user.type(screen.getByLabelText(/^Имя \(RU\)/), 'Сергей');
    await save(user);
    expect(await screen.findByText(/Петров Сергей/)).toBeInTheDocument();

    // Выбор дня должен уцелеть, иначе секция уедет не в тот день
    await openTab(user, 'Секции');
    expect(await screen.findByLabelText('День программы')).toHaveValue('12');

    await user.click(await findButton(/Добавить секцию/));
    await user.type(await screen.findByLabelText(/^Название \(RU\)/), 'Секция второго дня');
    await save(user);

    expect(contentAPI.createCongressProgramSection).toHaveBeenLastCalledWith(
      expect.objectContaining({ title_ru: 'Секция второго дня', day_id: 12 })
    );
  }, 30000);

  it('удаление выбранного дня не оставляет выбор на удалённом дне', async () => {
    store.days = [
      { id: 11, congress_id: 1, title_ru: 'День 1', date: '2026-09-25', order: 0 },
      { id: 12, congress_id: 1, title_ru: 'День 2', date: '2026-09-26', order: 1 },
    ];
    store.sections = [
      { id: 21, day_id: 11, title_ru: 'Секция первого дня', order: 0 },
      { id: 22, day_id: 12, title_ru: 'Секция второго дня', order: 0 },
    ];

    const user = setupUser();
    renderAdmin();

    await openTab(user, 'Секции');
    await user.selectOptions(await screen.findByLabelText('День программы'), '12');
    expect(await screen.findByText('Секция второго дня')).toBeInTheDocument();

    // Удаляем день, который сейчас выбран
    await openTab(user, 'Дни программы');
    await deleteRow(user, 'День 2');

    await openTab(user, 'Секции');
    expect(await screen.findByLabelText('День программы')).toHaveValue('11');
    expect(await screen.findByText('Секция первого дня')).toBeInTheDocument();
    expect(screen.queryByText('Секция второго дня')).not.toBeInTheDocument();

    // Удаляем последний оставшийся день — выбор должен сброситься в null
    await openTab(user, 'Дни программы');
    await deleteRow(user, 'День 1');

    await openTab(user, 'Секции');
    expect(await screen.findByText('Нет дней программы')).toBeInTheDocument();
    expect(screen.queryByText('Секция первого дня')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('День программы')).not.toBeInTheDocument();
  }, 30000);

  it('смена конгресса не оставляет дни предыдущего, если запрос упал', async () => {
    store.congresses = [
      { id: 1, title_ru: 'Конгресс 2026', is_active: true },
      { id: 2, title_ru: 'Конгресс 2027', is_active: true },
    ];
    store.days = [{ id: 11, congress_id: 1, title_ru: 'День первого конгресса', date: '2026-09-25', order: 0 }];
    store.sections = [{ id: 21, day_id: 11, title_ru: 'Секция первого конгресса', order: 0 }];

    const user = setupUser();
    renderAdmin();

    await openTab(user, 'Дни программы');
    expect(await screen.findByText('День первого конгресса')).toBeInTheDocument();

    contentAPI.getCongressProgramDays.mockRejectedValueOnce({ response: { data: { detail: 'нет связи' } } });
    await user.selectOptions(screen.getByLabelText('Конгресс'), '2');

    expect(await screen.findByText(/Ошибка загрузки дней программы: нет связи/)).toBeInTheDocument();
    // Данные предыдущего конгресса не должны «протекать» в новый
    expect(await screen.findByText('Дней программы пока нет')).toBeInTheDocument();
    expect(screen.queryByText('День первого конгресса')).not.toBeInTheDocument();

    await openTab(user, 'Спикеры');
    await user.click(await findButton(/Добавить спикера/));
    expect(screen.queryByText('Секция первого конгресса')).not.toBeInTheDocument();
  }, 30000);

  it('падение одного запроса не ломает остальную вкладку', async () => {
    store.days = [
      { id: 11, congress_id: 1, title_ru: 'День 1', date: '2026-09-25', order: 0 },
      { id: 12, congress_id: 1, title_ru: 'День 2', date: '2026-09-26', order: 1 },
    ];
    contentAPI.getCongressSponsors.mockRejectedValueOnce({ response: { data: { detail: 'сервер недоступен' } } });

    const user = setupUser();
    renderAdmin();

    expect(await screen.findByText(/Ошибка загрузки спонсоров: сервер недоступен/)).toBeInTheDocument();

    // Дни программы загрузились, несмотря на упавший запрос спонсоров
    await openTab(user, 'Дни программы');
    expect(await screen.findByText('День 1')).toBeInTheDocument();
    expect(screen.getByText('День 2')).toBeInTheDocument();

    // И секции можно добавлять
    await openTab(user, 'Секции');
    await user.selectOptions(await screen.findByLabelText('День программы'), '12');
    expect(screen.getByText(/Добавить секцию/, { selector: 'button' })).toBeInTheDocument();
  }, 30000);
});
