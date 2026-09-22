import { describe, it, expect, vi } from 'vitest';
import { readBlobError, filenameFromDisposition, contentAPI } from '../api';

// Сеть — мок экземпляра axios: проверяем только тело запроса
const { post } = vi.hoisted(() => ({ post: vi.fn(() => Promise.resolve({ data: null })) }));
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post,
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

describe('contentAPI.issueCertificate', () => {
  it('шлёт recipient_id, full_name и phone, ответ — блоб', async () => {
    await contentAPI.issueCertificate(7, { recipient_id: 5, full_name: 'Алиев Али Валиевич', phone: '+998 90' });
    expect(post).toHaveBeenCalledWith(
      '/congress/congresses/7/certificates/issue',
      { recipient_id: 5, full_name: 'Алиев Али Валиевич', phone: '+998 90' },
      { responseType: 'blob' },
    );
  });
});

// Ошибка axios при responseType: 'blob' — тело JSON приходит блобом
const blobError = (body, status = 404) => ({
  response: { status, data: new Blob([body], { type: 'application/json' }) },
});

describe('readBlobError', () => {
  it('достаёт код из detail блоба', async () => {
    expect(await readBlobError(blobError('{"detail":"not_found"}'))).toBe('not_found');
    expect(await readBlobError(blobError('{"detail":"limit_reached"}', 403))).toBe('limit_reached');
  });

  it('detail-объект — берёт code', async () => {
    expect(await readBlobError(blobError('{"detail":{"code":"no_name_column","columns":["Город"]}}', 400)))
      .toBe('no_name_column');
  });

  it('уже разобранный JSON тоже понимает', async () => {
    expect(await readBlobError({ response: { data: { detail: 'too_many_requests' } } })).toBe('too_many_requests');
  });

  it('не разобрать — null', async () => {
    expect(await readBlobError(blobError('<html>502</html>', 502))).toBeNull();
    expect(await readBlobError(new Error('Network Error'))).toBeNull();
    expect(await readBlobError(undefined)).toBeNull();
  });
});

describe('filenameFromDisposition', () => {
  it('берёт латинское имя из filename=', () => {
    expect(filenameFromDisposition(
      "attachment; filename=\"Certificate_Shodieva_Sitora.pdf\"; filename*=UTF-8''Certificate_%D0%A8.pdf"
    )).toBe('Certificate_Shodieva_Sitora.pdf');
    expect(filenameFromDisposition('attachment; filename=Certificate_Ali.pdf')).toBe('Certificate_Ali.pdf');
  });

  it('только filename* — раскодирует', () => {
    expect(filenameFromDisposition("attachment; filename*=UTF-8''Certificate_%D0%90%D0%BB%D0%B8.pdf"))
      .toBe('Certificate_Али.pdf');
  });

  it('нет заголовка или имени — Certificate.pdf', () => {
    expect(filenameFromDisposition(undefined)).toBe('Certificate.pdf');
    expect(filenameFromDisposition('attachment')).toBe('Certificate.pdf');
  });
});
