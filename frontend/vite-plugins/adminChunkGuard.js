import { gzipSync } from 'node:zlib';

// Бюджет gzip куска-входа (публичный JS, который качает каждый посетитель), байты.
// Поднимать только осознанно: рост входа — это секунды на медленном канале.
// Сейчас: 135.7 КБ после выноса публичных страниц, кроме главной, в ленивые куски
// (К-10, замер 2026-09-15) плюс ~10 КБ запаса. До К-10 было 181.6 КБ и бюджет 192.
export const ENTRY_GZIP_BUDGET = 146 * 1024;

const ADMIN_DIRS = ['/src/pages/admin/', '/src/components/admin/'];

const normalize = (id) => id.replace(/\\/g, '/');

const isAdminModule = (id) => {
  const path = normalize(id);
  return ADMIN_DIRS.some((dir) => path.includes(dir));
};

// Во входе из страниц — только главная; остальные грузятся при переходе (К-10).
// Просмотр PDF нужен двум страницам конгресса — ему место в их кусках.
const isLazyPublicModule = (id) => {
  const path = normalize(id);
  if (path.includes('/src/components/pdf/')) return true;
  return path.includes('/src/pages/') && !path.endsWith('/src/pages/Home.jsx');
};

const kb = (bytes) => (bytes / 1024).toFixed(1);

// Проверяет bundle из generateBundle. Бросает Error с объяснением, если
// в кусок-вход попал код админки, публичная страница кроме главной,
// просмотр PDF или gzip входа больше бюджета.
export function checkBundle(bundle, { budget = ENTRY_GZIP_BUDGET } = {}) {
  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== 'chunk' || !chunk.isEntry) continue;

    const adminModules = Object.keys(chunk.modules).filter(isAdminModule).map(normalize);
    if (adminModules.length > 0) {
      throw new Error(
        `В кусок-вход ${chunk.fileName} попал код админки — ` +
          'публичные страницы снова будут его качать. Импортируйте админку только ' +
          'через ленивый AdminApp (React.lazy в App.jsx). Модули:\n  ' +
          adminModules.join('\n  ')
      );
    }

    const pageModules = Object.keys(chunk.modules).map(normalize).filter(isLazyPublicModule);
    if (pageModules.length > 0) {
      throw new Error(
        `В кусок-вход ${chunk.fileName} попали публичные страницы или просмотр PDF — ` +
          'каждый посетитель снова будет качать код всех страниц. Во входе из src/pages ' +
          'остаётся только Home.jsx: остальные страницы подключайте через React.lazy в App.jsx, ' +
          'а src/components/pdf импортируйте только из ленивых страниц. Модули:\n  ' +
          pageModules.join('\n  ')
      );
    }

    const gzipBytes = gzipSync(chunk.code).length;
    if (gzipBytes > budget) {
      throw new Error(
        `Кусок-вход ${chunk.fileName}: ${kb(gzipBytes)} КБ gzip, ` +
          `бюджет ${kb(budget)} КБ. Если рост оправдан, поднимите бюджет осознанно — ` +
          'правкой константы ENTRY_GZIP_BUDGET в frontend/vite-plugins/adminChunkGuard.js ' +
          'с объяснением в коммите. Иначе вынесите тяжёлое в ленивый кусок.'
      );
    }
  }
}

// Vite-плагин: роняет `vite build`, если сторож нашёл нарушение.
export default function adminChunkGuard() {
  return {
    name: 'admin-chunk-guard',
    apply: 'build',
    generateBundle(_options, bundle) {
      try {
        checkBundle(bundle);
      } catch (err) {
        this.error(err.message);
      }
    },
  };
}
