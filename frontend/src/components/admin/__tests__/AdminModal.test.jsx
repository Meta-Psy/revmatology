import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminModal from '../AdminModal';

describe('AdminModal', () => {
  it('renders nothing when open is false', () => {
    render(<AdminModal open={false} onClose={() => {}} title="Test">Content</AdminModal>);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders title and content when open', () => {
    render(<AdminModal open={true} onClose={() => {}} title="Test Modal">Modal content here</AdminModal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content here')).toBeInTheDocument();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<AdminModal open={true} onClose={onClose} title="Test">Content</AdminModal>);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape pressed', () => {
    const onClose = vi.fn();
    render(<AdminModal open={true} onClose={onClose} title="Test">Content</AdminModal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn();
    render(<AdminModal open={true} onClose={onClose} title="Test">Content</AdminModal>);
    // Click on the overlay (the outer div)
    const overlay = screen.getByText('Content').closest('.fixed');
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(
      <AdminModal open={true} onClose={() => {}} title="Test" footer={<button>Save</button>}>
        Content
      </AdminModal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
