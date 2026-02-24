import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

const TestComponent = () => {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Saved!')}>Success</button>
      <button onClick={() => toast.error('Failed!')}>Error</button>
      <button onClick={() => toast.info('Info message')}>Info</button>
    </div>
  );
};

describe('Toast', () => {
  it('renders success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    await act(async () => {
      screen.getByText('Success').click();
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('renders error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    await act(async () => {
      screen.getByText('Error').click();
    });
    expect(screen.getByText('Failed!')).toBeInTheDocument();
  });

  it('renders info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    await act(async () => {
      screen.getByText('Info').click();
    });
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useToast must be used within ToastProvider');
    spy.mockRestore();
  });
});
