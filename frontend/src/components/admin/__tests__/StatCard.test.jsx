import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatCard from '../StatCard';
import { Newspaper } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Новости" value={12} icon={Newspaper} />);
    expect(screen.getByText('Новости')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders as link when to prop provided', () => {
    render(
      <MemoryRouter>
        <StatCard label="Users" value={5} icon={Newspaper} to="/admin/users" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/users');
  });

  it('renders without link when no to prop', () => {
    render(<StatCard label="Count" value={42} icon={Newspaper} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders zero value', () => {
    render(<StatCard label="Empty" value={0} icon={Newspaper} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Status" value="—" icon={Newspaper} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
