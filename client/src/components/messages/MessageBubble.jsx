import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useUiStore } from '../../store/useUiStore';
import { Avatar } from '../common/Avatar';
import { Edit2, Trash2, X, AlertCircle, Clock, RefreshCw, Ban } from 'lucide-react';

// ─── Message Status Icons ──────────────────────────────────────────────────────
// Single grey tick  = sent (saved to server, not yet read)
// Double grey ticks = delivered (received by recipient — we use this for sent in DB)
// Double blue ticks = read
// Clock             = sending (optimistic, in flight)
// Red alert         = failed to send

const MessageStatusIcon = ({ message, isOwn }) => {
  if (!isOwn || message.isDeleted) return null;

  if (message._failed) {
    return (
      <span title="Failed to send — tap to retry">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 inline" />
      </span>
    );
  }

  if (message._sending) {
    return (
      <span title="Sending...">
        <Clock className="w-3 h-3 text-indigo-300/60 inline animate-pulse" />
      </span>
    );
  }

  if (message.read) {
    // Double blue ticks — Seen
    return (
      <span title="Seen" className="inline-flex items-center">
        <svg width="16" height="11" viewBox="0 0 16 11" className="inline">
          {/* First tick */}
          <path
            d="M1 5.5L4.5 9L10 2"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Second tick (offset right) */}
          <path
            d="M5 5.5L8.5 9L14 2"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
    );
  }

  // Single grey tick — Sent (delivered to server)
  return (
    <span title="Sent">
      <svg width="10" height="9" viewBox="0 0 10 9" className="inline">
        <path
          d="M1 4.5L3.8 7.5L9 1"
          stroke="rgba(148,163,184,0.8)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
};

export const MessageBubble = ({ message, isGroup }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { editMessage, deleteMessage, sendMessage } = useMessageStore();
  const { setLightboxImage, addToast } = useUiStore();

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const senderId =
    typeof message.sender === 'object' && message.sender !== null
      ? (message.sender._id || message.sender.id)?.toString()
      : message.sender?.toString();

  const blockedUsers = useAuthStore((state) => state.user?.blockedUsers);
  const isOwn = senderId === currentUserId;
  const isSenderBlocked = !isOwn && senderId && Array.isArray(blockedUsers)
    ? blockedUsers.some((id) => (typeof id === 'object' && id !== null ? id._id || id.id || id : id)?.toString() === senderId)
    : false;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    try {
      await editMessage(message._id, editText.trim());
      setIsEditing(false);
      addToast('Message edited', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to edit message', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteMessage(message._id);
        addToast('Message deleted', 'info');
      } catch (err) {
        addToast(err.message || 'Failed to delete message', 'error');
      }
    }
  };

  const handleRetry = async () => {
    // Remove the failed message and retry send
    const { messages } = useMessageStore.getState();
    useMessageStore.setState({
      messages: messages.filter((m) => m._id !== message._id),
    });
    try {
      await sendMessage(message.chatId, message.text, message.image);
    } catch {
      addToast('Failed to send message', 'error');
    }
  };

  // If sender is blocked in a group chat, show collapsed notice by default
  if (isSenderBlocked && !showBlockedMessage) {
    return (
      <div className="flex items-center gap-2 my-2 justify-start">
        {!isOwn && <Avatar user={message.sender} size="xs" />}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
          <Ban className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>
            Message from blocked user ({typeof message.sender === 'object' ? message.sender.firstname : 'User'})
          </span>
          <button
            type="button"
            onClick={() => setShowBlockedMessage(true)}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 ml-1 underline transition-colors"
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex items-end gap-2 my-2.5 group ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {/* Sender Avatar for Received Messages */}
      {!isOwn && (
        <Avatar user={message.sender} size="xs" />
      )}

      <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name in Group Chat */}
        {!isOwn && isGroup && message.sender && typeof message.sender === 'object' && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <span className="text-[11px] font-semibold text-indigo-400">
              {message.sender.firstname} {message.sender.lastname}
            </span>
            {isSenderBlocked && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                <Ban className="w-2 h-2" /> Blocked
              </span>
            )}
          </div>
        )}

        {/* Message Card Container */}
        <div
          className={`relative p-3.5 rounded-2xl text-sm shadow-md transition-all ${
            message.isDeleted
              ? 'bg-dark-800/80 border border-slate-700/50 text-slate-400 italic'
              : message._failed
              ? 'bg-rose-900/30 border border-rose-500/40 text-slate-100 rounded-br-none'
              : isOwn
              ? 'bg-gradient-to-tr from-brand-700 to-brand-600 text-white rounded-br-none border border-brand-500/30'
              : 'bg-dark-800 text-slate-100 rounded-bl-none border border-white/10'
          } ${message._sending ? 'opacity-75' : 'opacity-100'}`}
        >
          {isSenderBlocked && (
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10 text-[10px] text-rose-300">
              <span className="flex items-center gap-1">
                <Ban className="w-2.5 h-2.5" /> Blocked user message
              </span>
              <button
                onClick={() => setShowBlockedMessage(false)}
                className="text-slate-400 hover:text-white underline text-[9px]"
              >
                Hide
              </button>
            </div>
          )}
          {/* Edit Form */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2 min-w-[220px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-dark-950 text-white text-xs border border-brand-500 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-brand-500 text-white text-[11px] font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Image Attachment */}
              {message.image && !message.isDeleted && (
                <div className="mb-2 rounded-xl overflow-hidden cursor-pointer max-w-sm">
                  <img
                    src={message.image}
                    alt="Message attachment"
                    onClick={() => setLightboxImage(message.image)}
                    className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {/* Text Content */}
              {message.text && <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>}

              {/* Timestamp + Status Ticks */}
              <div
                className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] ${
                  isOwn ? 'text-indigo-200/80' : 'text-slate-400'
                }`}
              >
                {message.isEdited && !message.isDeleted && <span>(edited)</span>}
                <span>{formatTime(message.createdAt)}</span>
                <MessageStatusIcon message={message} isOwn={isOwn} />
              </div>
            </>
          )}

          {/* Failed — Retry Button */}
          {message._failed && !isEditing && (
            <button
              onClick={handleRetry}
              className="mt-1 flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}

          {/* Hover Actions Bar — only for own non-deleted, non-sending messages */}
          {isOwn && !message.isDeleted && !isEditing && !message._sending && !message._failed && (
            <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 p-1 rounded-lg bg-dark-950 border border-white/10 shadow-lg text-slate-400">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:text-white hover:bg-white/10 rounded"
                title="Edit Message"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 hover:text-rose-400 hover:bg-rose-500/20 rounded"
                title="Delete Message"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
