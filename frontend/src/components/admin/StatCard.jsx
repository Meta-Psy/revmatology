import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color = 'blue', to }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color] || colors.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  return content;
};

export default StatCard;
