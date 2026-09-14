import { describe, it, expect } from 'vitest';
import { checkBundle, ENTRY_GZIP_BUDGET } from '../adminChunkGuard';

// Поддельный bundle в форме, которую Rollup отдаёт в generateBundle:
// { [fileName]: chunk | asset }, у куска modules — { [id]: {...} }.
const chunk = (fileName, { isEntry = false, modules = [], code = 'export {};' } = {}) => ({
  type: 'chunk',
  fileName,
  isEntry,
  code,
  modules: Object.fromEntries(modules.map((id) => [id, { renderedLength: 1 }])),
});

const asset = (fileName) => ({ type: 'asset', fileName, source: 'body{}' });

const bundleOf = (...items) => Object.fromEntries(items.map((it) => [it.fileName, it]));

const PUBLIC_MODULES = [
  '/repo/frontend/src/main.jsx',
  '/repo/frontend/src/App.jsx',
  '/repo/frontend/src/pages/Home.jsx',
  '/repo/frontend/node_modules/react/index.js',
];

describe('checkBundle — сторож куска-входа', () => {
  it('молчит на чистом бандле: админка только в своём куске, вход в бюджете', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', { isEntry: true, modules: PUBLIC_MODULES }),
      chunk('assets/AdminApp-def.js', {
        modules: [
          '/repo/frontend/src/pages/admin/AdminApp.jsx',
          '/repo/frontend/src/components/admin/AdminTable.jsx',
        ],
      }),
      asset('assets/index-abc.css'),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).not.toThrow();
  });

  it('бросает, если во входе модуль из src/pages/admin (пути Windows)', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', {
        isEntry: true,
        modules: [
          'C:\\Users\\dev\\frontend\\src\\main.jsx',
          'C:\\Users\\dev\\frontend\\src\\pages\\admin\\Dashboard.jsx',
        ],
      }),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).toThrow(/src\/pages\/admin\/Dashboard\.jsx/);
  });

  it('бросает, если во входе модуль из src/components/admin (пути Linux)', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', {
        isEntry: true,
        modules: [...PUBLIC_MODULES, '/home/runner/work/frontend/src/components/admin/AdminTable.jsx'],
      }),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).toThrow(/src\/components\/admin\/AdminTable\.jsx/);
  });

  it('молчит, если во входе главная (src/pages/Home.jsx), а остальные страницы и PDF — в своих кусках', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', {
        isEntry: true,
        modules: [...PUBLIC_MODULES, 'C:\\Users\\dev\\frontend\\src\\components\\layout\\Layout.jsx'],
      }),
      chunk('assets/CongressProgram-def.js', {
        modules: [
          '/repo/frontend/src/pages/CongressProgram.jsx',
          '/repo/frontend/src/components/pdf/PdfPages.jsx',
        ],
      }),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).not.toThrow();
  });

  it('бросает, если во входе публичная страница кроме главной (пути Windows), и называет её', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', {
        isEntry: true,
        modules: [
          'C:\\Users\\dev\\frontend\\src\\main.jsx',
          'C:\\Users\\dev\\frontend\\src\\pages\\Home.jsx',
          'C:\\Users\\dev\\frontend\\src\\pages\\Congress.jsx',
        ],
      }),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).toThrow(/src\/pages\/Congress\.jsx/);
    expect(() => checkBundle(bundle, { budget: 10_000 })).toThrow(/React\.lazy/);
    expect(() => checkBundle(bundle, { budget: 10_000 })).not.toThrow(/src\/pages\/Home\.jsx/);
  });

  it('бросает, если во входе просмотр PDF из src/components/pdf (пути Linux)', () => {
    const bundle = bundleOf(
      chunk('assets/index-abc.js', {
        isEntry: true,
        modules: [...PUBLIC_MODULES, '/home/runner/work/frontend/src/components/pdf/PdfPages.jsx'],
      }),
    );

    expect(() => checkBundle(bundle, { budget: 10_000 })).toThrow(/src\/components\/pdf\/PdfPages\.jsx/);
  });

  it('бросает, если gzip куска-входа больше бюджета, и объясняет, как поднять бюджет', () => {
    // Случайный текст почти не сжимается — gzip заведомо больше 1 КБ
    let code = '';
    for (let i = 0; i < 4000; i++) code += Math.random().toString(36).slice(2);
    const bundle = bundleOf(chunk('assets/index-abc.js', { isEntry: true, modules: PUBLIC_MODULES, code }));

    expect(() => checkBundle(bundle, { budget: 1024 })).toThrow(/ENTRY_GZIP_BUDGET/);
  });

  it('по умолчанию берёт бюджет из константы ENTRY_GZIP_BUDGET', () => {
    expect(ENTRY_GZIP_BUDGET).toBeGreaterThan(0);
    const bundle = bundleOf(chunk('assets/index-abc.js', { isEntry: true, modules: PUBLIC_MODULES }));

    expect(() => checkBundle(bundle)).not.toThrow();
  });
});
