import React from 'react';
import { Avatar } from '../common/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { usePresenceStore } from '../../store/usePresenceStore';
import { Users } from 'lucide-react';

// Stable empty array to prevent Zustand selector from returning a new reference
// on every render (which causes "getSnapshot should be cached" infinite loop)
const EMPTY_ARRAY = [];

export const ChatCard = ({ chat, isActive, onClick }) => {
  const currentUser = useAuthStore((state) => state.user);
  const chatId = chat?._id;
  const typingUsers = usePresenceStore(
    (state) => (chatId ? state.typingUsersByChat[chatId] ?? EMPTY_ARRAY : EMPTY_ARRAY)
  );

  if (!chat) return null;

  const currentUserId = currentUser?._id || currentUser?.id;
  const getMemberId = (m) => (typeof m === 'object' && m !== null ? m._id || m.id : m);

  const activeTypers = typingUsers.filter((u) => u.userId !== currentUserId);

  const otherMember = chat.isGroupChat
    ? null
    : chat.members?.find((m) => getMemberId(m) !== currentUserId) || chat.members?.[0];

  const otherMemberObj = typeof otherMember === 'object' && otherMember !== null ? otherMember : null;

  const chatName = chat.isGroupChat
    ? chat.groupName || 'Group Chat'
    : otherMemberObj
    ? `${otherMemberObj.firstname || ''} ${otherMemberObj.lastname || ''}`.trim() || otherMemberObj.email || 'Chat User'
    : 'Chat User';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const blockedUsers = useAuthStore((state) => state.user?.blockedUsers);
  const otherMemberIdStr = otherMember ? getMemberId(otherMember)?.toString() : null;
  const isBlockedByMe = otherMemberIdStr && Array.isArray(blockedUsers)
    ? blockedUsers.some((id) => (typeof id === 'object' && id !== null ? id._id || id.id || id : id)?.toString() === otherMemberIdStr)
    : false;
  const isBlockedByOther = Boolean(chat.isBlockedByOther);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left relative group ${
        isActive
          ? 'bg-brand-600/20 border border-brand-500/30 shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <Avatar
        user={otherMemberObj}
        name={chatName}
        isGroup={chat.isGroupChat}
        size="md"
        showOnline={!chat.isGroupChat && !isBlockedByMe && !isBlockedByOther}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
            }`}
          >
            {chatName}
          </h4>
          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
            {formatTime(chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {activeTypers.length > 0 ? (
            <span className="text-xs text-indigo-400 font-medium animate-pulse truncate">
              {activeTypers.map((t) => t.firstname).join(', ')} is typing...
            </span>
          ) : (
            <p className="text-xs text-slate-400 truncate">
              {chat.lastMessage || (chat.isGroupChat ? 'Group created' : 'No messages yet')}
            </p>
          )}

          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold shadow-[0_0_10px_rgba(99,102,241,0.6)]">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>

      {chat.isGroupChat && (
        <Users className="w-3.5 h-3.5 text-purple-400/70 absolute top-3.5 right-3" />
      )}
    </button>
  );
};
