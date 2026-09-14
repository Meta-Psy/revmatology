/**
 * Текущий раздел — пункт с наибольшей страницей не дальше текущей
 * (при равных — последний по порядку, т. е. самый вложенный).
 * Путь пункта — индексы по уровням: «1.0» — первый ребёнок второго пункта.
 */
const findActivePath = (items, currentPage) => {
  let best = null;
  const walk = (list, prefix) => {
    list.forEach((item, i) => {
      const path = prefix ? `${prefix}.${i}` : String(i);
      if (Number.isInteger(item.page) && item.page <= currentPage && (!best || item.page >= best.page)) {
        best = { page: item.page, path };
      }
      if (Array.isArray(item.children)) walk(item.children, path);
    });
  };
  walk(items, '');
  return best?.path ?? null;
};

const OutlineList = ({ items, prefix, depth, activePath, onSelect }) => (
  <ul>
    {items.map((item, i) => {
      const path = prefix ? `${prefix}.${i}` : String(i);
      const active = path === activePath;
      return (
        <li key={path}>
          <button
            type="button"
            onClick={() => onSelect(item.page)}
            aria-current={active ? 'true' : undefined}
            className={`w-full flex items-baseline gap-2 py-1.5 pr-3 text-left text-sm leading-snug transition-colors ${
              active ? 'bg-cyan-50 text-cyan-800 font-medium' : 'text-stone-700 hover:bg-stone-50'
            }`}
            style={{ paddingLeft: `${12 + depth * 14}px`, fontFamily: 'Georgia, serif' }}
          >
            <span className="flex-1 min-w-0">{item.title}</span>
            <span className="text-xs text-stone-400 tabular-nums">{item.page}</span>
          </button>
          {Array.isArray(item.children) && item.children.length > 0 && (
            <OutlineList
              items={item.children}
              prefix={path}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          )}
        </li>
      );
    })}
  </ul>
);

/** Оглавление из закладок PDF (manifest.outline): вложенный список, подсветка текущего раздела. */
const PdfOutline = ({ items, currentPage, onSelect }) => (
  <OutlineList
    items={items}
    prefix=""
    depth={0}
    activePath={findActivePath(items, currentPage)}
    onSelect={onSelect}
  />
);

export default PdfOutline;
