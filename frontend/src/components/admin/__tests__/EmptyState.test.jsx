import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="Список пуст" />);
    expect(screen.getByText('Список пуст')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState description="Добавьте первую запись" />);
    expect(screen.getByText('Добавьте первую запись')).toBeInTheDocument();
  });

  it('renders action', () => {
    render(<EmptyState action={<button>Добавить</button>} />);
    expect(screen.getByText('Добавить')).toBeInTheDocument();
  });
});
