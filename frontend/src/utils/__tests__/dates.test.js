import { describe, it, expect, afterEach, vi } from 'vitest';

import { formatDotDate } from '../dates';

// ---------------------------------------------------------------------------
// formatDotDate: дата открытия выдачи сертификатов (К-12).
// Сервер отдаёт её как «YYYY-MM-DD» по Ташкенту, поэтому функция разбирает
// строку регуляркой, а не через `new Date`. Здесь это и пиннится.
// ---------------------------------------------------------------------------

/** Пояса по обе стороны от UTC — в них `new Date('2026-09-26')` даёт разные сутки. */
const ZONES = ['UTC', 'America/New_York', 'Asia/Tokyo', 'Pacific/Kiritimati'];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('formatDotDate', () => {
  it('нормальная дата — ДД.ММ.ГГГГ', () => {
    expect(formatDotDate('2026-09-26')).toBe('26.09.2026');
  });

  it('дата с временем — берётся только дата', () => {
    expect(formatDotDate('2026-09-26T00:00:00+05:00')).toBe('26.09.2026');
  });

  it.each([
    ['пусто', ''],
    ['null', null],
    ['undefined', undefined],
    ['не дата', 'завтра'],
    ['уже отформатировано', '26.09.2026'],
  ])('%s — пустая строка', (_name, value) => {
    expect(formatDotDate(value)).toBe('');
  });

  it.each(ZONES)('в поясе %s дата та же', (tz) => {
    vi.stubEnv('TZ', tz);
    expect(formatDotDate('2026-09-26')).toBe('26.09.2026');
  });

  it('пояс действительно сдвинул бы дату, разбирай её `new Date`', () => {
    // Проверка остроты теста выше: под jsdom пояс меняется через process.env.TZ,
    // но если среда это проигнорирует, страховка ниже поймает сдвиг и без смены пояса.
    const viaDate = ZONES.map((tz) => {
      vi.stubEnv('TZ', tz);
      return new Date('2026-09-26').getDate();
    });
    const viaIntl = ZONES.map((timeZone) =>
      new Intl.DateTimeFormat('ru-RU', { timeZone, day: '2-digit' }).format(new Date('2026-09-26'))
    );
    expect(new Set([...viaDate.map(String), ...viaIntl]).size).toBeGreaterThan(1);
  });
});
