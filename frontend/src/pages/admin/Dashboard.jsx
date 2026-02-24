import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Users, CalendarDays, GraduationCap, Plus, ArrowRight } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { StatCard, CardSkeleton } from '../../components/admin';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } catch {
        setStats({ news: '—', users: '—', congressRegistrations: '—', schoolApplications: '—' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Добавить новость', path: '/admin/news', icon: Plus },
    { label: 'Заявки на конгресс', path: '/admin/congress', icon: CalendarDays },
    { label: 'Управление пользователями', path: '/admin/users', icon: Users },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-5">Панель управления</h1>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Новости" value={stats?.news} icon={Newspaper} color="blue" to="/admin/news" />
          <StatCard label="Пользователи" value={stats?.users} icon={Users} color="green" to="/admin/users" />
          <StatCard label="Регистрации на конгресс" value={stats?.congressRegistrations} icon={CalendarDays} color="purple" to="/admin/congress" />
          <StatCard label="Заявки в школу" value={stats?.schoolApplications} icon={GraduationCap} color="orange" />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors group"
            >
              <action.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 flex-1">{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
