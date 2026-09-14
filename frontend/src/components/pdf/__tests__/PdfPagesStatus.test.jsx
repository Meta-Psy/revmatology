import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

import PdfPagesStatus from '../PdfPagesStatus';

const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

let routes = {};
const fetchMock = vi.fn(async (url) => (url in routes ? response(200, routes[url]) : response(404)));

const MANIFEST = {
  version: 1,
  source: 'ys.pdf',
  page_count: 12,
  rendered: 12,
  truncated: false,
  widths: [800, 1600],
  pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, w: 1600, h: 2263 })),
  outline: [],
};

beforeEach(() => {
  routes = {};
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('PdfPagesStatus — страницы PDF в админке', () => {
  it('есть manifest.json → «Страницы готовы — N стр.»', async () => {
    routes['/uploads/ys.pages/manifest.json'] = MANIFEST;
    render(<PdfPagesStatus url="/uploads/ys.pdf" saved />);

    expect(await screen.findByText('Страницы готовы — 12 стр.')).toBeInTheDocument();
    // статус не должен залипать в кэше браузера
    expect(fetchMock).toHaveBeenCalledWith('/uploads/ys.pages/manifest.json', expect.objectContaining({ cache: 'no-store' }));
  });

  it('обрезано на 60 — видно, сколько страниц в PDF', async () => {
    routes['/uploads/ys.pages/manifest.json'] = { ...MANIFEST, page_count: 65, truncated: true };
    render(<PdfPagesStatus url="/uploads/ys.pdf" saved />);

    expect(await screen.findByText(/Страницы готовы — 12 стр\. \(в PDF 65/)).toBeInTheDocument();
  });

  it('есть .pages.error.json → «Ошибка: <message>»', async () => {
    routes['/uploads/ys.pages.error.json'] = {
      version: 1, source: 'ys.pdf', error: 'encrypted', message: 'Файл защищён паролем',
    };
    render(<PdfPagesStatus url="/uploads/ys.pdf" saved />);

    expect(await screen.findByText('Ошибка: Файл защищён паролем')).toBeInTheDocument();
  });

  it('ничего нет → «Готовятся…», и статус перепроверяется, пока страницы не появятся', async () => {
    vi.useFakeTimers();
    render(<PdfPagesStatus url="/uploads/ys.pdf" saved />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(screen.getByText('Готовятся…')).toBeInTheDocument();
    const firstRound = fetchMock.mock.calls.length;

    routes['/uploads/ys.pages/manifest.json'] = MANIFEST;
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(fetchMock.mock.calls.length).toBeGreaterThan(firstRound);
    expect(screen.getByText('Страницы готовы — 12 стр.')).toBeInTheDocument();

    // готово — опрос прекращается
    const done = fetchMock.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(fetchMock.mock.calls.length).toBe(done);
  });

  it('файл ещё не сохранён — страницы подготовятся после сохранения, запросов нет', () => {
    render(<PdfPagesStatus url="/uploads/new.pdf" saved={false} />);

    expect(screen.getByText('Страницы для просмотра на сайте подготовятся после сохранения')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('внешняя ссылка или пусто — строки нет', () => {
    const { container, rerender } = render(<PdfPagesStatus url="https://example.com/a.pdf" saved />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PdfPagesStatus url="" saved />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
