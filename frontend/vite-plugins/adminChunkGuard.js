import { gzipSync } from 'node:zlib';

// Бюджет gzip куска-входа (публичный JS, который качает каждый посетитель), байты.
// Поднимать только осознанно: рост входа — это секунды на медленном канале.
// Сейчас: 181.6 КБ после выноса админки в ленивый кусок (К-09) плюс ~10 КБ запаса.
export const ENTRY_GZIP_BUDGET = 192 * 1024;

const ADMIN_DIRS = ['/src/pages/admin/', '/src/components/admin/'];

const normalize = (id) => id.replace(/\\/g, '/');

const isAdminModule = (id) => {
  const path = normalize(id);
  return ADMIN_DIRS.some((dir) => path.includes(dir));
};

const kb = (bytes) => (bytes / 1024).toFixed(1);

// Проверяет bundle из generateBundle. Бросает Error с объяснением, если
// в кусок-вход попал код админки или его gzip больше бюджета.
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
