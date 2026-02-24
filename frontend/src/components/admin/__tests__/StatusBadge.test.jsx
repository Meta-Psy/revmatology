import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('shows active state with default text', () => {
    render(<StatusBadge active={true} />);
    expect(screen.getByText('Активен')).toBeInTheDocument();
  });

  it('shows inactive state with default text', () => {
    render(<StatusBadge active={false} />);
    expect(screen.getByText('Неактивен')).toBeInTheDocument();
  });

  it('shows custom active text', () => {
    render(<StatusBadge active={true} activeText="Опубликован" />);
    expect(screen.getByText('Опубликован')).toBeInTheDocument();
  });

  it('shows custom inactive text', () => {
    render(<StatusBadge active={false} inactiveText="Черновик" />);
    expect(screen.getByText('Черновик')).toBeInTheDocument();
  });

  it('has green styling when active', () => {
    const { container } = render(<StatusBadge active={true} />);
    const badge = container.firstChild;
    expect(badge.className).toContain('bg-green-50');
  });

  it('has slate styling when inactive', () => {
    const { container } = render(<StatusBadge active={false} />);
    const badge = container.firstChild;
    expect(badge.className).toContain('bg-slate-100');
  });
});
