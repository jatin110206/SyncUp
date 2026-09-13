import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useUiStore } from '../../store/useUiStore';
import { emitTyping, emitStopTyping } from '../../services/socket';
import { Send, Image, Smile, X, Loader2, Ban } from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '💯', '🙏', '👏', '😍', '😎'];

export const MessageComposer = ({ chatId }) => {
  const currentUser = useAuthStore((state) => state.user);
  const blockedUsers = useAuthStore((state) => state.user?.blockedUsers);
  const unblockUser = useAuthStore((state) => state.unblockUser);
  const blockedByUsers = useChatStore((state) => state.blockedByUsers);
  const activeChat = useChatStore((state) => state.activeChat);
  const { sendMessage } = useMessageStore();
  const { addToast } = useUiStore();

  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const otherMember = activeChat && !activeChat.isGroupChat
    ? activeChat.members?.find((m) => (typeof m === 'object' ? (m._id || m.id) : m)?.toString() !== currentUserId)
    : null;

  const otherMemberObj = typeof otherMember === 'object' && otherMember !== null ? otherMember : null;
  const otherMemberIdStr = (otherMemberObj ? otherMemberObj._id || otherMemberObj.id : typeof otherMember === 'string' ? otherMember : null)?.toString();

  const isBlocked = otherMemberIdStr && Array.isArray(blockedUsers)
    ? blockedUsers.some((id) => (typeof id === 'object' && id !== null ? id._id || id.id || id : id)?.toString() === otherMemberIdStr)
    : false;

  const isBlockedByOther = Boolean(
    activeChat?.isBlockedByOther ||
    (otherMemberIdStr && Array.isArray(blockedByUsers) && blockedByUsers.includes(otherMemberIdStr))
  );

  const handleUnblock = async () => {
    if (!otherMemberIdStr) return;
    try {
      await unblockUser(otherMemberIdStr);
      addToast('User unblocked successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to unblock user';
      addToast(msg, 'error');
    }
  };

  // Debounced typing status handling
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!isTypingRef.current && currentUser) {
      isTypingRef.current = true;
      emitTyping(chatId, currentUser._id, currentUser.firstname);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (currentUser) {
        emitStopTyping(chatId, currentUser._id);
      }
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size must be less than 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imagePreview) || isSending || isBlocked || isBlockedByOther) return;

    setIsSending(true);
    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (currentUser) {
        emitStopTyping(chatId, currentUser._id);
        isTypingRef.current = false;
      }

      await sendMessage(chatId, text.trim(), imagePreview);
      setText('');
      setImagePreview(null);
      setShowEmojiPicker(false);
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  if (isBlocked) {
    return (
      <div className="p-3.5 border-t border-white/10 bg-dark-900/90 backdrop-blur-md relative z-20">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>You have blocked this user. Unblock to resume messaging.</span>
          </div>
          <button
            onClick={handleUnblock}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex-shrink-0 shadow-sm"
          >
            Unblock
          </button>
        </div>
      </div>
    );
  }

  if (isBlockedByOther) {
    return (
      <div className="p-3.5 border-t border-white/10 bg-dark-900/90 backdrop-blur-md relative z-20">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300 font-medium">
          <Ban className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>This user is unavailable. You cannot send messages to this user.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-white/10 bg-dark-900/90 backdrop-blur-md relative z-20">
      {/* Image Preview Box */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-xl border border-brand-500/50 shadow-lg"
          />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 p-2 rounded-2xl glass-panel border border-white/10 shadow-2xl flex items-center gap-1.5 z-30">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg p-1.5 hover:bg-white/10 rounded-xl transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Attach Image"
        >
          <Image className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition-colors ${
            showEmojiPicker ? 'text-amber-400 bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title="Insert Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input Area */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send)"
          className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-400"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center"
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};
