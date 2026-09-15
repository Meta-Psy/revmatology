import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { createTestI18n } from '../test/i18n-test-utils';

// Посетитель не вошёл: AuthProvider просто пропускает детей, шапка рисует «Вход»
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, isAdmin: false, loading: false, logout: vi.fn() }),
}));

// Страницы здесь заглушки — сеть не нужна
vi.mock('../services/api', () => ({
  authAPI: {},
  contentAPI: {},
  adminAPI: {},
  getImageUrl: (path) => path,
}));

// Главная — во входе (статический импорт), поэтому заглушка на весь файл
vi.mock('../pages/Home', () => ({
  default: () => <h1>Главная (заглушка)</h1>,
}));

const ACTIVITIES = '../pages/Activities';
const HISTORY = '../pages/History';
const CONGRESS = '../pages/Congress';
const CONGRESS_PROGRAM = '../pages/CongressProgram';
const NEWS = '../pages/News';
const LOGIN = '../pages/Login';

const stubPage = (title) => ({ default: () => <h1>{title}</h1> });

// Кусок страницы «висит» в загрузке, пока тест не вызовет release().
// После release кусок доходит не мгновенно (холодный импорт) — findBy с запасом.
const gatedStub = (title) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const factory = async () => {
    await gate;
    return stubPage(title);
  };
  return { factory, release: () => release() };
};

// App сам создаёт BrowserRouter, поэтому адрес ставим до render.
// Каждый тест импортирует свежий App: React.lazy кэширует загруженный кусок.
const renderAppAt = async (path) => {
  window.history.pushState({}, '', path);
  const { default: App } = await import('../App');
  return render(
    <I18nextProvider i18n={createTestI18n('ru')}>
      <App />
    </I18nextProvider>
  );
};

// Холодная транспиляция App, шапки и подвала — вне тайминга тестов
beforeAll(async () => {
  await import('../App');
}, 60000);

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  [ACTIVITIES, HISTORY, CONGRESS, CONGRESS_PROGRAM, NEWS, LOGIN].forEach((path) => vi.doUnmock(path));
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

describe('App — публичные страницы ленивыми кусками', () => {
  it('на / код остальных страниц не импортируется', async () => {
    const congressImported = vi.fn();
    const programImported = vi.fn();
    vi.doMock(CONGRESS, () => {
      congressImported();
      return stubPage('Конгресс (заглушка)');
    });
    vi.doMock(CONGRESS_PROGRAM, () => {
      programImported();
      return stubPage('Программа (заглушка)');
    });

    await renderAppAt('/');

    expect(await screen.findByText('Главная (заглушка)')).toBeInTheDocument();
    expect(congressImported).not.toHaveBeenCalled();
    expect(programImported).not.toHaveBeenCalled();
  }, 15000);

  it('прямой заход на /about/history: заглушка загрузки внутри Layout, потом страница', async () => {
    const history = gatedStub('История (заглушка)');
    vi.doMock(HISTORY, history.factory);

    await renderAppAt('/about/history');

    // Шапка и подвал на месте, в области контента — заглушка
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Загрузка...');
    expect(screen.queryByText('История (заглушка)')).not.toBeInTheDocument();

    history.release();

    const page = await screen.findByText('История (заглушка)', {}, { timeout: 10000 });
    expect(within(screen.getByRole('main')).getByText('История (заглушка)')).toBe(page);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  }, 15000);

  it('переход с главной по меню: главная видна, пока грузится кусок, потом новая страница в Layout', async () => {
    const user = userEvent.setup();
    const congress = gatedStub('Конгресс (заглушка)');
    vi.doMock(CONGRESS, congress.factory);

    await renderAppAt('/');
    expect(await screen.findByText('Главная (заглушка)')).toBeInTheDocument();

    await user.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Конгресс' }));

    // Переход идёт через startTransition — старая страница не сменяется заглушкой
    expect(screen.getByText('Главная (заглушка)')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    congress.release();

    expect(await screen.findByText('Конгресс (заглушка)', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByText('Главная (заглушка)')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  }, 15000);

  it('сбой загрузки куска страницы — сообщение в области контента, шапка на месте', async () => {
    // React пишет пойманную boundary ошибку в console.error — здесь это ожидаемо
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.doMock(CONGRESS, () => {
      throw new Error('Failed to fetch dynamically imported module');
    });

    await renderAppAt('/congress/1');

    const main = screen.getByRole('main');
    expect(await within(main).findByText('Страница не загрузилась', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(within(main).getByText('Проверьте соединение и обновите страницу.')).toBeInTheDocument();
    expect(within(main).getByRole('button', { name: 'Обновить страницу' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  }, 15000);

  it('после сбоя переход по меню снимает ошибку и рисует новую страницу', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    vi.doMock(CONGRESS, () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    vi.doMock(NEWS, () => stubPage('Новости (заглушка)'));

    await renderAppAt('/congress/1');
    expect(await screen.findByText('Страница не загрузилась', {}, { timeout: 10000 })).toBeInTheDocument();

    await user.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Новости' }));

    expect(await screen.findByText('Новости (заглушка)', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByText('Страница не загрузилась')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/news');
  }, 15000);

  // <Navigate> рисует пустоту, и она уже раскрыта в Suspense: переход на ленивую цель
  // идёт через startTransition и держит раскрытое — main был бы пуст всю загрузку куска.
  it.each(['/about', '/activities'])('редирект %s → /about/activities: пока грузится кусок, в main заглушка, а не пустота', async (from) => {
    const activities = gatedStub('Деятельность (заглушка)');
    vi.doMock(ACTIVITIES, activities.factory);

    await renderAppAt(from);

    await waitFor(() => expect(window.location.pathname).toBe('/about/activities'));
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Загрузка...');

    activities.release();

    expect(await screen.findByText('Деятельность (заглушка)', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  }, 15000);

  it('сорвавшийся кусок при переходе по меню: ошибка, уход на другую страницу, возврат — снова ошибка', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    vi.doMock(CONGRESS, () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    vi.doMock(NEWS, () => stubPage('Новости (заглушка)'));
    const footerLink = (name) => within(screen.getByRole('contentinfo')).getByRole('link', { name });

    await renderAppAt('/');
    expect(await screen.findByText('Главная (заглушка)')).toBeInTheDocument();

    await user.click(footerLink('Конгресс'));
    expect(await within(screen.getByRole('main')).findByText('Страница не загрузилась', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/congress');
    expect(screen.getByRole('banner')).toBeInTheDocument();

    await user.click(footerLink('Новости'));
    expect(await screen.findByText('Новости (заглушка)', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByText('Страница не загрузилась')).not.toBeInTheDocument();

    // React.lazy помнит отказ: на ту же страницу — снова ошибка, без зацикливания
    await user.click(footerLink('Конгресс'));
    expect(await within(screen.getByRole('main')).findByText('Страница не загрузилась', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/congress');
    expect(screen.queryByText('Новости (заглушка)')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  }, 30000);

  it('/login вне Layout: своя заглушка загрузки, потом страница входа', async () => {
    const login = gatedStub('Вход (заглушка)');
    vi.doMock(LOGIN, login.factory);

    await renderAppAt('/login');

    expect(screen.getByRole('status')).toHaveTextContent('Загрузка...');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();

    login.release();

    expect(await screen.findByText('Вход (заглушка)', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  }, 15000);
});
