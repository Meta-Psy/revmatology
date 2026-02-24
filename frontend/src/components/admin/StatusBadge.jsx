const StatusBadge = ({ active, activeText = 'Активен', inactiveText = 'Неактивен' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
      active
        ? 'bg-green-50 text-green-700'
        : 'bg-slate-100 text-slate-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-400'}`} />
      {active ? activeText : inactiveText}
    </span>
  );
};

export default StatusBadge;
