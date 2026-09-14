import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Админ уже вошёл: AuthProvider просто пропускает детей
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { full_name: 'Администратор', role: 'admin' }, isAdmin: true, loading: false }),
}));

vi.mock('../services/api', () => ({
  authAPI: {},
  contentAPI: {},
  adminAPI: {
    getStats: vi.fn(() =>
      Promise.resolve({ data: { news: 3, users: 5, congressRegistrations: 2, schoolApplications: 1 } })
    ),
  },
}));

// Публичная часть здесь не проверяется — заглушки вместо шапки/подвала и главной
vi.mock('../components/layout/Layout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('../pages/Home', () => ({
  default: () => <h1>Главная (заглушка)</h1>,
}));

const ADMIN_APP = '../pages/admin/AdminApp';
const ADMIN_LAYOUT = '../pages/admin/AdminLayout';

// App сам создаёт BrowserRouter, поэтому адрес ставим до render.
// Каждый тест импортирует свежий App: React.lazy кэширует загруженный кусок.
const renderAppAt = async (path) => {
  window.history.pushState({}, '', path);
  const { default: App } = await import('../App');
  return render(<App />);
};

// Холодная транспиляция App и всей админки — вне тайминга тестов:
// под нагрузкой полного прогона она одна занимает больше 15 с.
beforeAll(async () => {
  await import('../App');
  await import('../pages/admin/AdminApp');
}, 60000);

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock(ADMIN_APP);
  vi.doUnmock(ADMIN_LAYOUT);
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

describe('App — ленивый кусок админки', () => {
  it('на /admin сначала заглушка «Загрузка…», потом дашборд', async () => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    vi.doMock(ADMIN_APP, async (importOriginal) => {
      await gate;
      return importOriginal();
    });

    await renderAppAt('/admin');

    expect(screen.getByText('Загрузка…')).toBeInTheDocument();
    expect(screen.queryByText('Панель управления')).not.toBeInTheDocument();

    release();

    expect(await screen.findByText('Панель управления', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument();
    // Пункт «Дашборд» в меню активен — index-маршрут совпал с /admin
    expect(screen.getByRole('link', { name: 'Дашборд' })).toHaveClass('bg-blue-50');
  }, 15000);

  it('на / код админки не импортируется', async () => {
    const adminAppImported = vi.fn();
    const adminLayoutImported = vi.fn();
    vi.doMock(ADMIN_APP, async (importOriginal) => {
      adminAppImported();
      return importOriginal();
    });
    vi.doMock(ADMIN_LAYOUT, async (importOriginal) => {
      adminLayoutImported();
      return importOriginal();
    });

    await renderAppAt('/');

    expect(await screen.findByText('Главная (заглушка)')).toBeInTheDocument();
    expect(adminAppImported).not.toHaveBeenCalled();
    expect(adminLayoutImported).not.toHaveBeenCalled();
  });

  it('при сбое загрузки куска — сообщение и кнопка «Обновить страницу» вместо белого экрана', async () => {
    // React пишет пойманную boundary ошибку в console.error — здесь это ожидаемо
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.doMock(ADMIN_APP, () => {
      throw new Error('Failed to fetch dynamically imported module');
    });

    await renderAppAt('/admin');

    expect(await screen.findByText('Не удалось загрузить админку')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Обновить страницу' })).toBeInTheDocument();
  });
});
