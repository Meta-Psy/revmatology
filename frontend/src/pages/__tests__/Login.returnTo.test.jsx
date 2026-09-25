import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import Login from '../Login';
import { createTestI18n } from '../../test/i18n-test-utils';

// ---------------------------------------------------------------------------
// После входа — назад на страницу, которая отправила на вход (К-12: /profile)
// ---------------------------------------------------------------------------
const login = vi.hoisted(() => vi.fn());

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login }),
}));

const renderAt = (entry) => {
  const { container } = render(
    <I18nextProvider i18n={createTestI18n('ru')}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<h1>Кабинет (заглушка)</h1>} />
          <Route path="/" element={<h1>Главная (заглушка)</h1>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
  fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'a@b.uz' } });
  fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'secret123' } });
  fireEvent.submit(container.querySelector('form'));
};

beforeEach(() => {
  login.mockReset();
  login.mockResolvedValue({ id: 1 });
});

describe('Login — возврат после входа', () => {
  it('пришли с /profile — туда и возвращаемся', async () => {
    renderAt({ pathname: '/login', state: { from: '/profile' } });
    expect(await screen.findByText('Кабинет (заглушка)')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith('a@b.uz', 'secret123');
  });

  it('без исходной страницы — на главную', async () => {
    renderAt('/login');
    expect(await screen.findByText('Главная (заглушка)')).toBeInTheDocument();
  });
});
