import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { usePresenceStore } from '../../store/usePresenceStore';
import { useUiStore } from '../../store/useUiStore';
import { Avatar } from '../common/Avatar';
import { OnlineBadge } from '../common/OnlineBadge';
import { Search, Info, Phone, Video, Users, ArrowLeft } from 'lucide-react';

// Stable empty array — prevents Zustand selector creating a new reference each render
const EMPTY_ARRAY = [];

export const ChatHeader = ({ chat, onBack, onToggleInChatSearch }) => {
  const currentUser = useAuthStore((state) => state.user);
  const blockedUsers = useAuthStore((state) => state.user?.blockedUsers);
  const blockedByUsers = useChatStore((state) => state.blockedByUsers);
  const { toggleChatDetails } = useUiStore();
  const chatId = chat?._id;
  const typingUsers = usePresenceStore((state) => (chatId ? state.typingUsersByChat[chatId] ?? EMPTY_ARRAY : EMPTY_ARRAY));

  if (!chat) return null;

  const currentUserId = currentUser?._id || currentUser?.id;
  const getMemberId = (m) => (typeof m === 'object' && m !== null ? m._id || m.id : m);

  const activeTypers = typingUsers.filter((u) => u.userId !== currentUserId);

  const otherMember = chat.isGroupChat
    ? null
    : chat.members?.find((m) => getMemberId(m) !== currentUserId) || chat.members?.[0];

  const otherMemberObj = typeof otherMember === 'object' && otherMember !== null ? otherMember : null;
  const otherMemberId = getMemberId(otherMember);
  const otherMemberIdStr = otherMemberId ? otherMemberId.toString() : null;

  const isBlockedByMe = otherMemberIdStr && Array.isArray(blockedUsers)
    ? blockedUsers.some((id) => (typeof id === 'object' && id !== null ? id._id || id.id || id : id)?.toString() === otherMemberIdStr)
    : false;

  const isBlockedByOther = Boolean(
    chat.isBlockedByOther ||
    (otherMemberIdStr && Array.isArray(blockedByUsers) && blockedByUsers.includes(otherMemberIdStr))
  );

  const chatName = chat.isGroupChat
    ? chat.groupName || 'Group Chat'
    : otherMemberObj
    ? `${otherMemberObj.firstname || ''} ${otherMemberObj.lastname || ''}`.trim() || otherMemberObj.email || 'Chat User'
    : 'Chat User';

  const groupAdminObj = typeof chat.groupAdmin === 'object' && chat.groupAdmin !== null ? chat.groupAdmin : null;

  return (
    <div className="h-16 px-4 border-b border-white/10 bg-dark-900/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar
          user={otherMemberObj}
          name={chatName}
          isGroup={chat.isGroupChat}
          size="md"
          showOnline={!chat.isGroupChat && !isBlockedByMe && !isBlockedByOther}
        />

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base tracking-tight">{chatName}</h3>
            {chat.isGroupChat && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-medium">
                <Users className="w-3 h-3" />
                {chat.members?.length || 0} members
              </span>
            )}
          </div>

          <div className="text-xs">
            {activeTypers.length > 0 ? (
              <span className="text-indigo-400 font-medium animate-pulse">
                {activeTypers.map((t) => t.firstname).join(', ')} is typing...
              </span>
            ) : chat.isGroupChat ? (
              <span className="text-slate-400">
                Group Admin:{' '}
                {groupAdminObj
                  ? `${groupAdminObj.firstname || ''} ${groupAdminObj.lastname || ''}`.trim()
                  : 'Admin'}
              </span>
            ) : isBlockedByMe ? (
              <span className="text-rose-400/90 font-medium">Blocked</span>
            ) : isBlockedByOther ? (
              <span className="text-amber-400/80 font-medium">Unavailable</span>
            ) : (
              <OnlineBadge userId={otherMemberId} />
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleInChatSearch}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Search in Chat"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          className="p-2 rounded-xl text-slate-500 cursor-not-allowed transition-colors"
          title="Voice Call (Coming Soon)"
          disabled
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          className="p-2 rounded-xl text-slate-500 cursor-not-allowed transition-colors"
          title="Video Call (Coming Soon)"
          disabled
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={toggleChatDetails}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          title="Chat Details"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
