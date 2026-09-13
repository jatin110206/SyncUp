import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '../../store/useMessageStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePresenceStore } from '../../store/usePresenceStore';
import { MessageBubble } from './MessageBubble';
import { MessageSkeleton } from '../common/SkeletonLoaders';
import { MessageCircle } from 'lucide-react';

const EMPTY_ARRAY = [];

export const MessageList = ({ isGroup }) => {
  const { messages, isLoading } = useMessageStore();
  const activeChat = useChatStore((state) => state.activeChat);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const chatId = activeChat?._id;

  const typingUsers = usePresenceStore(
    (state) => (chatId ? state.typingUsersByChat[chatId] ?? EMPTY_ARRAY : EMPTY_ARRAY)
  );
  const activeTypers = typingUsers.filter((u) => u.userId !== currentUserId);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTypers.length]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (isLoading) return <MessageSkeleton />;

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mb-3">
          <MessageCircle className="w-8 h-8 text-brand-400" />
        </div>
        <h4 className="font-semibold text-white text-base">No messages yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Send a greeting or attach a photo to break the ice on SyncUp!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((msg, index) => {
        const currentDateLabel = formatDateLabel(msg.createdAt);
        const prevDateLabel = index > 0 ? formatDateLabel(messages[index - 1].createdAt) : null;
        const showDateDivider = currentDateLabel !== prevDateLabel;

        return (
          <React.Fragment key={msg._id || index}>
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-400">
                  {currentDateLabel}
                </span>
              </div>
            )}
            <MessageBubble message={msg} isGroup={isGroup} />
          </React.Fragment>
        );
      })}

      {/* Real-time typing bubble */}
      {activeTypers.length > 0 && (
        <div className="flex items-center gap-2 my-2.5">
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-slate-800/90 border border-white/10 text-xs text-slate-300 flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="font-semibold text-brand-300">
              {activeTypers.map((t) => t.firstname).join(', ')}
            </span>
            <span className="text-slate-400">
              {activeTypers.length > 1 ? 'are typing' : 'is typing'}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
