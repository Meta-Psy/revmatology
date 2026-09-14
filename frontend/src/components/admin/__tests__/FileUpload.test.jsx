import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../FileUpload';

const fileInput = (container) => container.querySelector('input[type="file"]');

describe('FileUpload', () => {
  it('тот же файл можно выбрать повторно (например, после ошибки загрузки)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<FileUpload value="" onChange={onChange} accept=".pdf" preview={false} />);

    const file = new File(['%PDF-1.4'], 'program.pdf', { type: 'application/pdf' });
    await user.upload(fileInput(container), file);
    await user.upload(fileInput(container), file);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(2, file);
  });

  it('картинка с превью: превью из value, крестик очищает поле', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<FileUpload value="/uploads/photo.jpg" onChange={onChange} accept="image/*" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/photo.jpg');
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('выбор картинки передаёт файл наверх', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<FileUpload value="" onChange={onChange} accept="image/*" />);

    const image = new File(['img'], 'photo.png', { type: 'image/png' });
    await user.upload(fileInput(container), image);

    expect(onChange).toHaveBeenCalledWith(image);
  });
});
