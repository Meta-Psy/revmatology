import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageHeader from '../PageHeader';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PageHeader', () => {
  it('renders title', () => {
    renderWithRouter(<PageHeader title="Новости" />);
    expect(screen.getByText('Новости')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    renderWithRouter(
      <PageHeader
        title="Новости"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Новости' },
        ]}
      />
    );
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // "Новости" appears in both breadcrumb and h1 title
    const matches = screen.getAllByText('Новости');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('renders breadcrumb links', () => {
    renderWithRouter(
      <PageHeader
        title="Редактор"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Новости', path: '/admin/news' },
          { label: 'Редактор' },
        ]}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/admin');
    expect(links[1]).toHaveAttribute('href', '/admin/news');
  });

  it('renders action button', () => {
    renderWithRouter(
      <PageHeader title="Новости" action={<button>Добавить</button>} />
    );
    expect(screen.getByText('Добавить')).toBeInTheDocument();
  });

  it('renders without breadcrumbs', () => {
    renderWithRouter(<PageHeader title="Дашборд" />);
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
