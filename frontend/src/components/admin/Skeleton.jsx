const Skeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex gap-4 border-b border-slate-100 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-3.5 flex-1 rounded" style={{ maxWidth: j === 0 ? '40%' : '25%' }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="skeleton h-3 w-20 rounded mb-2" />
          <div className="skeleton h-7 w-16 rounded" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
