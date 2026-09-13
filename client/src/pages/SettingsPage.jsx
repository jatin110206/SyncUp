import React from 'react';
import { useUiStore } from '../store/useUiStore';
import { Settings, Moon, Sun, Monitor, Bell, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const { theme, setTheme, addToast } = useUiStore();
  const navigate = useNavigate();

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    addToast(`Theme set to ${newTheme}`, 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-dark-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <button
            onClick={() => navigate('/app')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Application Settings</h2>
            <p className="text-xs text-slate-400">Configure appearance, notifications, and privacy options</p>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-white tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            Appearance & Theme
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'bg-brand-600/30 border-brand-500 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-semibold">Dark Mode</span>
            </button>

            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'bg-brand-600/30 border-brand-500 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-semibold">Light Mode</span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                theme === 'system'
                  ? 'bg-brand-600/30 border-brand-500 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Monitor className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-semibold">System Default</span>
            </button>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-white tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            Notification Preferences
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
              <div>
                <span className="text-sm font-semibold text-white block">Real-time Sound Effects</span>
                <span className="text-xs text-slate-400">Play audio ping when receiving messages</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
              <div>
                <span className="text-sm font-semibold text-white block">Desktop Notifications</span>
                <span className="text-xs text-slate-400">Show browser push popups for new chats</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
