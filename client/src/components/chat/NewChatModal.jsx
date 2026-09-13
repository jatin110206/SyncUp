import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUiStore } from '../../store/useUiStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../services/userService';
import { Avatar } from '../common/Avatar';
import { Search, MessageSquare, Copy, Check, UserPlus, Fingerprint } from 'lucide-react';

export const NewChatModal = () => {
  const { isNewChatModalOpen, setNewChatModalOpen, addToast } = useUiStore();
  const { createOneOnOneChat } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const myUsername = currentUser?.username;
  const myUserIdHandle = myUsername ? `@${myUsername}` : (currentUser?._id || currentUser?.id || '');

  useEffect(() => {
    if (!isNewChatModalOpen) {
      setQuery('');
      setUsers([]);
      setIsLoading(false);
    }
  }, [isNewChatModalOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.searchUsers(query);
        setUsers(data.users || []);
      } catch (err) {
        console.error('[NewChat] Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleCopyMyId = () => {
    if (!myUserIdHandle) return;
    navigator.clipboard.writeText(myUserIdHandle);
    setCopied(true);
    addToast('Your Unique User ID copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartChat = async (userId) => {
    try {
      await createOneOnOneChat(userId);
      setNewChatModalOpen(false);
      setQuery('');
      addToast('Conversation started', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to start chat', 'error');
    }
  };

  return (
    <Modal
      isOpen={isNewChatModalOpen}
      onClose={() => setNewChatModalOpen(false)}
      title="New Conversation"
    >
      <div className="space-y-4">
        {/* Your Unique User ID Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Your Unique User ID
              </p>
              <p className="text-xs font-mono font-bold text-brand-300 truncate select-all">
                {myUserIdHandle}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyMyId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex-shrink-0 shadow-sm"
            title="Copy your custom ID to share with others"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Find Someone
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter User ID (@username), Email, or Name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results / Prompt */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-400 animate-pulse">
              Searching user database...
            </div>
          ) : query.trim() && users.length > 0 ? (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleStartChat(user._id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={user} size="md" showOnline />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-brand-300 transition-colors text-sm truncate">
                      {user.firstname} {user.lastname}
                    </h4>
                    <p className="text-xs text-indigo-400 font-mono font-medium truncate">
                      {user.username ? `@${user.username}` : user.email}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">ID: {user._id}</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-brand-600/20 text-brand-300 group-hover:bg-brand-600 group-hover:text-white transition-colors flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No user found matching &quot;{query}&quot;. Verify the User ID or Email.
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <UserPlus className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Enter a recipient&apos;s <strong>Unique User ID</strong> or <strong>Email</strong> above to start a conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
