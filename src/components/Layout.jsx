import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarCheck,
  Flame,
  Users,
  Settings,
  PlusCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/today',
      label: 'Hari Ini',
      icon: CalendarCheck,
    },
    {
      to: '/habits',
      label: 'Kebiasaan',
      icon: Flame,
    },
    {
      to: '/community',
      label: 'Komunitas',
      icon: Users,
    },
    {
      to: '/settings',
      label: 'Profil',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-5 sticky top-0 h-screen select-none">
        {/* Brand */}
        <div className="flex items-center space-x-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <p className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              LangkahKecil
            </p>
            <p className="text-[11px] font-medium text-slate-600 -mt-0.5">Micro-Habit & Accountability</p>
          </div>
        </div>

        {/* CTA Tambah Kebiasaan */}
        <button
          onClick={() => navigate('/habits/new')}
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 mb-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Kebiasaan</span>
        </button>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/today' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        {user && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div
                onClick={() => navigate(`/u/${user.username}`)}
                className="flex items-center space-x-2.5 overflow-hidden cursor-pointer flex-1 mr-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {user.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-snug">
                    {user.display_name}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                aria-label="Keluar dari akun"
                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-100" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-emerald-800">
              LangkahKecil
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/habits/new')}
              className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Baru</span>
            </button>
            {user && (
              <div
                onClick={() => navigate(`/u/${user.username}`)}
                className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                {user.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Content Container (max width 720px centered) */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/today' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
