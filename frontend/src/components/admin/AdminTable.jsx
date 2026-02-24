import { useState } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './EmptyState';

const AdminTable = ({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  actions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  pageSize = 15,
  sortable = true,
}) => {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (colKey) => {
    if (!sortable) return;
    if (sortCol === colKey) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
    setPage(0);
  };

  let sortedData = [...(data || [])];
  if (sortCol) {
    sortedData.sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paged = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  if (!loading && (!data || data.length === 0)) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${col.width || ''} ${sortable && col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                  onClick={() => sortable && col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && col.sortable !== false && (
                      sortCol === col.key
                        ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                        : <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || actions) && (
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2.5 text-slate-700">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {(onEdit || onDelete || actions) && (
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {actions && actions(row)}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50/30">
          <span className="text-xs text-slate-500">
            {sortedData.length} записей
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setPage(0)} disabled={page === 0} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-slate-600">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
