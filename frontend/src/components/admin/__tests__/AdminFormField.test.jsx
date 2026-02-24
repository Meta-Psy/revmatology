import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminFormField from '../AdminFormField';

describe('AdminFormField', () => {
  it('renders label', () => {
    render(<AdminFormField label="Имя" name="name" value="" onChange={() => {}} />);
    expect(screen.getByText('Имя')).toBeInTheDocument();
  });

  it('renders required indicator', () => {
    render(<AdminFormField label="Email" name="email" required value="" onChange={() => {}} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders text input by default', () => {
    render(<AdminFormField label="Name" name="name" value="John" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('John');
  });

  it('calls onChange on input', () => {
    const onChange = vi.fn();
    render(<AdminFormField label="Name" name="name" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renders textarea', () => {
    render(<AdminFormField label="Bio" name="bio" type="textarea" value="text" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('text');
  });

  it('renders select', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];
    render(<AdminFormField label="Type" name="type" type="select" value="a" options={options} onChange={() => {}} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders checkbox', () => {
    render(<AdminFormField label="Active" name="active" type="checkbox" value={true} onChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders error message', () => {
    render(<AdminFormField label="Email" name="email" value="" error="Required" onChange={() => {}} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<AdminFormField label="Name" name="name" value="" placeholder="Enter name" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });
});
