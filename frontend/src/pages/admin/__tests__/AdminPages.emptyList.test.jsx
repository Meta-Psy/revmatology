import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../components/admin';
import BoardMembersAdmin from '../BoardMembersAdmin';
import ChiefRheumatologistsAdmin from '../ChiefRheumatologistsAdmin';

// ---------------------------------------------------------------------------
// Пустой список должен рисоваться (С-04). EmptyState ждёт иконку компонентом;
// элемент (<Users />) вместо компонента роняет страницу с ошибкой React #130.
// ---------------------------------------------------------------------------
const { contentAPI } = vi.hoisted(() => {
  const ok = (data) => Promise.resolve({ data });
  const contentAPI = {
    getBoardMembers: vi.fn(() => ok([])),
    getChiefRheumatologists: vi.fn(() => ok([])),
  };
  return { contentAPI };
});

vi.mock('../../../services/api', () => ({ contentAPI }));

const renderAdmin = (Page) =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <Page />
      </ToastProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each([
  ['BoardMembersAdmin', BoardMembersAdmin, 'Членов правления пока нет'],
  ['ChiefRheumatologistsAdmin', ChiefRheumatologistsAdmin, 'Главных ревматологов пока нет'],
])('%s: пустой список', (_, Page, emptyTitle) => {
  it('рисует пустое состояние без ошибки', async () => {
    renderAdmin(Page);
    expect(await screen.findByText(emptyTitle)).toBeInTheDocument();
  });
});
