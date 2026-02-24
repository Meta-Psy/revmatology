import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(<ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByText('Подтверждение')).not.toBeInTheDocument();
  });

  it('shows default title and message', () => {
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText('Подтверждение')).toBeInTheDocument();
    expect(screen.getByText('Вы уверены?')).toBeInTheDocument();
  });

  it('shows custom title and message', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Удалить запись?"
        message="Это действие нельзя отменить"
      />
    );
    expect(screen.getByText('Удалить запись?')).toBeInTheDocument();
    expect(screen.getByText('Это действие нельзя отменить')).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog open={true} onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByText('Отмена'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Удалить'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows custom confirm text', () => {
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} confirmText="Да, удалить" />);
    expect(screen.getByText('Да, удалить')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} loading={true} />);
    expect(screen.getByText('Удаление...')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} loading={true} />);
    expect(screen.getByText('Отмена')).toBeDisabled();
    expect(screen.getByText('Удаление...')).toBeDisabled();
  });
});
