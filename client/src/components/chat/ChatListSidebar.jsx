import React, { useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useUiStore } from '../../store/useUiStore';
import { ChatCard } from './ChatCard';
import { ChatSkeleton } from '../common/SkeletonLoaders';
import { Search, Plus, MessageSquare, MessageCircle } from 'lucide-react';

export const ChatListSidebar = () => {
  const chats = useChatStore((state) => state.chats);
  const activeChat = useChatStore((state) => state.activeChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const isLoading = useChatStore((state) => state.isLoading);
  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  const activeTab = useChatStore((state) => state.activeTab);
  const setActiveTab = useChatStore((state) => state.setActiveTab);

  const { setNewChatModalOpen, setNewGroupModalOpen } = useUiStore();

  // Run fetchChats ONLY ONCE on mount to prevent infinite re-render loops
  useEffect(() => {
    fetchChats();
  }, []);

  // Filter chats by tab & search query
  const filteredChats = chats.filter((chat) => {
    if (!chat) return false;

    // Tab filter
    if (activeTab === 'unread' && (!chat.unreadCount || chat.unreadCount === 0)) return false;
    if (activeTab === 'groups' && !chat.isGroupChat) return false;

    // Query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (chat.isGroupChat) {
      return chat.groupName?.toLowerCase().includes(q);
    } else {
      return chat.members?.some(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          (m.firstname?.toLowerCase().includes(q) ||
            m.lastname?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q))
      );
    }
  });

  return (
    <div className="w-full md:w-80 lg:w-96 bg-dark-900 border-r border-white/10 flex flex-col h-full flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="New 1-on-1 Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNewGroupModalOpen(true)}
              className="p-2 rounded-xl bg-brand-600/30 border border-brand-500/30 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
              title="New Group Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or members..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-sm placeholder-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-dark-950/60 p-1 rounded-xl border border-white/5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'unread'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'groups'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <ChatSkeleton />
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatCard
              key={chat._id}
              chat={chat}
              isActive={activeChat?._id === chat._id}
              onClick={() => setActiveChat(chat)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4 text-slate-400">
            <MessageCircle className="w-12 h-12 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="font-medium text-slate-300">No conversations found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Start a new 1-on-1 chat or group to start communicating on SyncUp.
            </p>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-lg transition-colors"
            >
              Start Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
