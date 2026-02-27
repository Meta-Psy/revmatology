import { useState, useEffect } from 'react';
import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ToastProvider } from '../../components/admin/Toast';
import {
  LayoutDashboard, Newspaper, Users, UserCircle, Building2,
  Globe, FileText, Clock, Stethoscope, GraduationCap, BookOpen,
  CalendarDays, UserCog, PanelLeftClose, PanelLeftOpen,
  ExternalLink, Menu, X, Image
} from 'lucide-react';
import './admin.css';

const NAV_GROUPS = [
  {
    label: 'Основное',
    items: [
      { path: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
      { path: '/admin/news', label: 'Новости и события', icon: Newspaper },
    ],
  },
  {
    label: 'Организация',
    items: [
      { path: '/admin/board', label: 'Правление', icon: Users },
      { path: '/admin/chief-rheumatologists', label: 'Гл. ревматологи', icon: Stethoscope },
      { path: '/admin/centers', label: 'Центры', icon: Building2 },
      { path: '/admin/center-staff', label: 'Сотрудники центров', icon: UserCircle },
      { path: '/admin/partners', label: 'Партнёры', icon: Globe },
    ],
  },
  {
    label: 'Контент',
    items: [
      { path: '/admin/diseases', label: 'Заболевания', icon: FileText },
      { path: '/admin/education-events', label: 'Образование', icon: GraduationCap },
      { path: '/admin/media-resources', label: 'Медиаресурсы', icon: BookOpen },
      { path: '/admin/charter', label: 'Устав', icon: FileText },
      { path: '/admin/history', label: 'История', icon: Clock },
    ],
  },
  {
    label: 'Система',
    items: [
      { path: '/admin/congress', label: 'Конгресс', icon: CalendarDays },
      { path: '/admin/hero-images', label: 'Hero-фоны', icon: Image },
      { path: '/admin/users', label: 'Пользователи', icon: UserCog },
    ],
  },
];

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

const AdminLayout = () => {
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('admin_sidebar') === 'collapsed'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('admin_sidebar', collapsed ? 'collapsed' : 'expanded'); } catch {}
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Top Bar */}
        <header className="h-12 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">РА</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 hidden sm:inline">Админ-панель</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">На сайт</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-600 font-medium">{user?.full_name}</span>
          </div>
        </header>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden sidebar-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className="admin-sidebar fixed top-12 bottom-0 z-40 bg-white border-r border-slate-200 overflow-y-auto overflow-x-hidden hidden md:block"
          style={{ width: sidebarWidth }}
        >
          {/* Collapse toggle */}
          <div className="flex items-center justify-end p-2 border-b border-slate-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={collapsed ? 'Развернуть' : 'Свернуть'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                {!collapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                )}
                {collapsed && <div className="my-1 mx-2 border-t border-slate-100" />}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 pl-[10px]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent pl-[10px]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span className="sidebar-label">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <aside className="admin-sidebar fixed top-12 bottom-0 left-0 z-50 bg-white border-r border-slate-200 overflow-y-auto w-60 md:hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Меню</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-2">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-3">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 pl-[10px]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent pl-[10px]'
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`pt-12 transition-[margin] duration-200 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}
        >
          <div className="p-4 md:p-5 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
};

export default AdminLayout;
