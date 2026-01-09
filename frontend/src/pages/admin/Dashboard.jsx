import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    news: 12,
    users: 156,
    congressRegistrations: 89,
    schoolApplications: 34,
  });

  const quickActions = [
    { label: 'Добавить новость', path: '/admin/news/new', color: 'bg-blue-500' },
    { label: 'Заявки на конгресс', path: '/admin/congress/registrations', color: 'bg-green-500' },
    { label: 'Заявки в школу', path: '/admin/school/applications', color: 'bg-purple-500' },
  ];

  const recentActivity = [
    { type: 'news', action: 'Опубликована новость', title: 'Анонс III Конгресса', time: '2 часа назад' },
    { type: 'user', action: 'Новая регистрация', title: 'Иванов И.И.', time: '3 часа назад' },
    { type: 'congress', action: 'Заявка на конгресс', title: 'Петров П.П.', time: '5 часов назад' },
    { type: 'school', action: 'Заявка в школу', title: 'Сидоров С.С.', time: '1 день назад' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Панель управления</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Новости</p>
              <p className="text-3xl font-bold text-gray-800">{stats.news}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <Link to="/admin/news" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Управлять →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Пользователи</p>
              <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <Link to="/admin/users" className="text-sm text-green-600 hover:underline mt-2 inline-block">
            Управлять →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Заявки на конгресс</p>
              <p className="text-3xl font-bold text-gray-800">{stats.congressRegistrations}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Link to="/admin/congress" className="text-sm text-purple-600 hover:underline mt-2 inline-block">
            Просмотреть →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Заявки в школу</p>
              <p className="text-3xl font-bold text-gray-800">{stats.schoolApplications}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-orange-600 mt-2 inline-block">
            Просмотреть →
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h2>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.path}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Последняя активность</h2>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  item.type === 'news' ? 'bg-blue-500' :
                  item.type === 'user' ? 'bg-green-500' :
                  item.type === 'congress' ? 'bg-purple-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{item.action}</p>
                  <p className="text-sm text-gray-500">{item.title}</p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
