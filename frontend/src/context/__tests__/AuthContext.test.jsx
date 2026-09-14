import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { authAPI } = vi.hoisted(() => ({
  authAPI: { getMe: vi.fn(), login: vi.fn(), register: vi.fn() },
}));
vi.mock('../../services/api', () => ({ authAPI }));

import { AuthProvider, useAuth } from '../AuthContext';

// Значения loading на каждом рендере потребителя
let renders = [];

const Probe = () => {
  const { user, loading } = useAuth();
  renders.push(loading);
  if (loading) return <p>загрузка</p>;
  return <p>{user ? `пользователь: ${user.email}` : 'гость'}</p>;
};

const renderAuth = () => render(<AuthProvider><Probe /></AuthProvider>);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  renders = [];
});

describe('AuthProvider — восстановление сессии', () => {
  it('без токена: гость, /me не запрашивается', () => {
    renderAuth();
    expect(screen.getByText('гость')).toBeInTheDocument();
    expect(authAPI.getMe).not.toHaveBeenCalled();
  });

  it('без токена: ни одного рендера в состоянии загрузки', () => {
    renderAuth();
    expect(renders).not.toContain(true);
  });

  it('с токеном: загрузка до ответа /me, затем пользователь', async () => {
    localStorage.setItem('token', 'jwt');
    let answer;
    authAPI.getMe.mockReturnValue(new Promise((resolve) => { answer = resolve; }));

    renderAuth();
    expect(screen.getByText('загрузка')).toBeInTheDocument();

    answer({ data: { email: 'admin@example.uz', role: 'admin' } });
    expect(await screen.findByText('пользователь: admin@example.uz')).toBeInTheDocument();
    expect(authAPI.getMe).toHaveBeenCalledTimes(1);
  });

  it('с недействительным токеном: токен удаляется, загрузка завершается', async () => {
    localStorage.setItem('token', 'expired');
    authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

    renderAuth();
    expect(await screen.findByText('гость')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
