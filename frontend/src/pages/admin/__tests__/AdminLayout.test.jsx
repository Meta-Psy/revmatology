import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Администратор', role: 'admin' }, isAdmin: true, loading: false }),
}));

import AdminLayout from '../AdminLayout';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<p>Страница: дашборд</p>} />
          <Route path="news" element={<p>Страница: новости</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

// Мобильное меню — <aside> с заголовком «Меню»; рендерится только открытым
const mobileMenu = () => screen.queryByText('Меню')?.closest('aside') ?? null;

// Кнопка-бургер в верхней панели — первая кнопка в <header>, подписи у неё нет
const openMobileMenu = async (user, container) => {
  await user.click(container.querySelector('header button'));
  expect(mobileMenu()).not.toBeNull();
};

describe('AdminLayout — мобильное меню', () => {
  it('закрывается при переходе на другую страницу', async () => {
    const user = userEvent.setup();
    const { container } = renderAt('/admin');
    expect(mobileMenu()).toBeNull();

    await openMobileMenu(user, container);
    await user.click(within(mobileMenu()).getByText('Новости и события'));

    expect(await screen.findByText('Страница: новости')).toBeInTheDocument();
    expect(mobileMenu()).toBeNull();
  });

  it('остаётся открытым, пока адрес страницы не сменился', async () => {
    const user = userEvent.setup();
    const { container } = renderAt('/admin');

    await openMobileMenu(user, container);
    // Ссылка на текущую страницу: переход есть, pathname тот же
    await user.click(within(mobileMenu()).getByText('Дашборд'));

    expect(screen.getByText('Страница: дашборд')).toBeInTheDocument();
    expect(mobileMenu()).not.toBeNull();
  });
});
