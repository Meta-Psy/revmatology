import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const PageHeader = ({ title, breadcrumbs = [], action }) => {
  return (
    <div className="mb-5">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-slate-600 transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-slate-500">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
