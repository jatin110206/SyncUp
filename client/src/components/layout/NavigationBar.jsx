import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { Avatar } from '../common/Avatar';
import {
  MessageSquare,
  Search,
  UserPlus,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const NavigationBar = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, setCommandPaletteOpen, setNewGroupModalOpen } = useUiStore();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="w-16 md:w-20 bg-dark-900 border-r border-white/10 flex flex-col items-center justify-between py-4 flex-shrink-0 z-30">
      {/* Brand Logo Header */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/app"
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-accent-violet flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform"
          title="SyncUp App"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-3">
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `p-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'bg-brand-600/20 text-brand-500 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
            title="Conversations"
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          </NavLink>

          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title="Search Users (Cmd+K)"
          >
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={() => setNewGroupModalOpen(true)}
            className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title="Create New Group"
          >
            <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <Moon className="w-5 h-5 md:w-6 md:h-6" />
          )}
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `p-3 rounded-2xl transition-all ${
              isActive
                ? 'bg-brand-600/20 text-brand-500 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
          title="Settings"
        >
          <Settings className="w-5 h-5 md:w-6 md:h-6" />
        </NavLink>

        <NavLink
          to="/profile"
          className="hover:scale-105 transition-transform"
          title="User Profile"
        >
          <Avatar user={user} size="sm" showOnline />
        </NavLink>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </aside>
  );
};
