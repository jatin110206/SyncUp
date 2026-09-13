import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { Avatar } from './Avatar';
import {
  Search,
  MessageSquarePlus,
  Users,
  User,
  Settings,
  Moon,
  LogOut,
  X,
  Command,
} from 'lucide-react';

export const CommandPalette = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setNewGroupModalOpen, theme, setTheme } =
    useUiStore();
  const { logout } = useAuthStore();
  const { createOneOnOneChat } = useChatStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Global Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Debounced user search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await userService.searchUsers(query);
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('[CmdK] Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleStartChat = async (userId) => {
    try {
      await createOneOnOneChat(userId);
      setCommandPaletteOpen(false);
      setQuery('');
      navigate('/app');
    } catch (err) {
      console.error('[CmdK] Start chat error:', err);
    }
  };

  const handleCommand = (action) => {
    setCommandPaletteOpen(false);
    action();
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-10"
          >
            {/* Search Bar Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-5 h-5 text-indigo-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search users..."
                className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-base"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results / Commands List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {query.trim() ? (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Users Search Results
                  </div>
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-slate-400 animate-pulse">
                      Searching users...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleStartChat(user._id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar user={user} size="sm" showOnline />
                          <div>
                            <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                              {user.firstname} {user.lastname}
                            </div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          Start Chat
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-400">No users found</div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Commands
                  </div>

                  <button
                    onClick={() => handleCommand(() => navigate('/app'))}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
                    <span>Open Messages</span>
                  </button>

                  <button
                    onClick={() => handleCommand(() => setNewGroupModalOpen(true))}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Create New Group Chat</span>
                  </button>

                  <button
                    onClick={() => handleCommand(() => navigate('/profile'))}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    onClick={() => handleCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                  >
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Toggle Theme (Dark / Light)</span>
                  </button>

                  <button
                    onClick={() => handleCommand(() => logout())}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
