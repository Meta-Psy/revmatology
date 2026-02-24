import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTable from '../AdminTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (val) => <span data-testid="role">{val}</span> },
];

const data = [
  { id: 1, name: 'Иванов', email: 'ivanov@test.com', role: 'admin' },
  { id: 2, name: 'Петров', email: 'petrov@test.com', role: 'user' },
  { id: 3, name: 'Сидоров', email: 'sidorov@test.com', role: 'user' },
];

describe('AdminTable', () => {
  it('renders column headers', () => {
    render(<AdminTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<AdminTable columns={columns} data={data} />);
    expect(screen.getByText('Иванов')).toBeInTheDocument();
    expect(screen.getByText('Петров')).toBeInTheDocument();
    expect(screen.getByText('ivanov@test.com')).toBeInTheDocument();
  });

  it('renders custom render function', () => {
    render(<AdminTable columns={columns} data={data} />);
    const roles = screen.getAllByTestId('role');
    expect(roles).toHaveLength(3);
    expect(roles[0]).toHaveTextContent('admin');
  });

  it('shows empty state when data is empty', () => {
    render(<AdminTable columns={columns} data={[]} emptyTitle="Нет данных" />);
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });

  it('shows empty state when data is null', () => {
    render(<AdminTable columns={columns} data={null} emptyTitle="Пусто" />);
    expect(screen.getByText('Пусто')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<AdminTable columns={columns} data={data} onEdit={onEdit} />);
    const editButtons = screen.getAllByTitle('Редактировать');
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(data[0]);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<AdminTable columns={columns} data={data} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle('Удалить');
    fireEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(data[1]);
  });

  it('renders action column header when onEdit provided', () => {
    render(<AdminTable columns={columns} data={data} onEdit={() => {}} />);
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('does not render action column when no callbacks', () => {
    render(<AdminTable columns={columns} data={data} />);
    expect(screen.queryByText('Действия')).not.toBeInTheDocument();
  });

  it('sorts data when column header clicked', () => {
    render(<AdminTable columns={columns} data={data} />);
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    // After sorting by name ascending, order should be: Иванов, Петров, Сидоров
    const rows = screen.getAllByRole('row');
    // Row 0 is header, rows 1-3 are data
    expect(rows[1]).toHaveTextContent('Иванов');
  });

  it('shows dash for null values', () => {
    const dataWithNull = [{ id: 1, name: 'Test', email: null, role: 'user' }];
    render(<AdminTable columns={columns} data={dataWithNull} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('paginates when data exceeds pageSize', () => {
    const bigData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      role: 'user',
    }));
    render(<AdminTable columns={columns} data={bigData} pageSize={10} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('20 записей')).toBeInTheDocument();
  });
});
