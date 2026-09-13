import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useMessageStore } from '../store/useMessageStore';
import { usePresenceStore } from '../store/usePresenceStore';

import { connectSocket, joinChatRoom, leaveChatRoom } from '../services/socket';

import { ChatListSidebar } from '../components/chat/ChatListSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatDetailsPanel } from '../components/chat/ChatDetailsPanel';
import { MessageList } from '../components/messages/MessageList';
import { MessageComposer } from '../components/messages/MessageComposer';
import { InChatSearch } from '../components/messages/InChatSearch';
import { NewChatModal } from '../components/chat/NewChatModal';
import { NewGroupModal } from '../components/chat/NewGroupModal';

import { Sparkles } from 'lucide-react';

export const AppPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const activeChat = useChatStore((state) => state.activeChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const chats = useChatStore((state) => state.chats);

  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const handleIncomingSocketMessage = useMessageStore((state) => state.handleIncomingSocketMessage);

  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers);
  const setUserTyping = usePresenceStore((state) => state.setUserTyping);
  const setUserStopTyping = usePresenceStore((state) => state.setUserStopTyping);

  const [showInChatSearch, setShowInChatSearch] = useState(false);

  // Use refs for the callbacks to avoid stale closures in the socket handlers
  // These refs always point to the latest version of each function
  const onOnlineUsersUpdateRef = useRef(setOnlineUsers);
  const onReceiveMessageRef = useRef(handleIncomingSocketMessage);
  const onUserTypingRef = useRef(setUserTyping);
  const onUserStopTypingRef = useRef(setUserStopTyping);

  // Keep refs in sync with latest Zustand selectors
  useEffect(() => { onOnlineUsersUpdateRef.current = setOnlineUsers; }, [setOnlineUsers]);
  useEffect(() => { onReceiveMessageRef.current = handleIncomingSocketMessage; }, [handleIncomingSocketMessage]);
  useEffect(() => { onUserTypingRef.current = setUserTyping; }, [setUserTyping]);
  useEffect(() => { onUserStopTypingRef.current = setUserStopTyping; }, [setUserStopTyping]);

  // ─── Socket Initialization ──────────────────────────────────────────────────
  // Use ref-based callbacks so the effect only runs once (on userId change)
  // but the handlers always call the latest Zustand store functions.
  const userId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!userId) return;

    connectSocket(userId, {
      onOnlineUsersUpdate: (usersList) => {
        onOnlineUsersUpdateRef.current(usersList);
      },
      onReceiveMessage: (messageData) => {
        onReceiveMessageRef.current(messageData);
      },
      onUserTyping: (typingData) => {
        onUserTypingRef.current(typingData);
      },
      onUserStopTyping: (typingData) => {
        onUserStopTypingRef.current(typingData);
      },
      onNewChatCreated: (newChat) => {
        useChatStore.getState().fetchChats();
        if (newChat?._id) joinChatRoom(newChat._id);
      },
      onUserBlocked: (data) => {
        if (data?.blockerId) {
          useChatStore.getState().setUserBlockedMe(data.blockerId, true, data.chatId);
        }
      },
      onUserUnblocked: (data) => {
        if (data?.blockerId) {
          useChatStore.getState().setUserBlockedMe(data.blockerId, false, data.chatId);
        }
      },
      onChatBlockUpdated: (data) => {
        if (data?.blockerId) {
          useChatStore.getState().setUserBlockedMe(data.blockerId, data.isBlocked, data.chatId);
        }
      },
    });

    // Cleanup: disconnect on unmount (page navigation / logout)
    return () => {
      // Don't disconnect here — we want the socket to persist across route changes.
      // Disconnection is handled in the logout action.
    };
  }, [userId]); // Only re-run when user changes

  // ─── Client-side room joining safety net ────────────────────────────────────
  // The server auto-joins all rooms on user-online. But as a client-side safety net,
  // whenever the chat list updates, join any rooms we haven't joined yet.
  useEffect(() => {
    if (!chats || chats.length === 0) return;
    chats.forEach((chat) => {
      if (chat?._id) {
        joinChatRoom(chat._id);
      }
    });
  }, [chats]);

  // ─── Active Chat Room Handling ───────────────────────────────────────────────
  const activeChatId = activeChat?._id;
  useEffect(() => {
    if (!activeChatId) return;

    joinChatRoom(activeChatId);
    fetchMessages(activeChatId);

    // We don't leave the room on chat close — we want to keep receiving messages
    // from all chats (the server auto-joined all rooms anyway)
  }, [activeChatId, fetchMessages]);

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Column 1: Conversations List Sidebar */}
      <div
        className={`h-full ${
          activeChat ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <ChatListSidebar />
      </div>

      {/* Column 2: Active Chat Pane */}
      <div
        className={`flex-1 flex flex-col h-full bg-dark-950 relative overflow-hidden ${
          !activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeChat ? (
          <>
            <ChatHeader
              chat={activeChat}
              onBack={() => setActiveChat(null)}
              onToggleInChatSearch={() => setShowInChatSearch(!showInChatSearch)}
            />

            {showInChatSearch && (
              <InChatSearch onClose={() => setShowInChatSearch(false)} />
            )}

            <MessageList isGroup={activeChat.isGroupChat} />

            <MessageComposer chatId={activeChat._id} />
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dark-950">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 to-accent-violet/20 border border-white/10 flex items-center justify-center mb-4 shadow-2xl animate-float">
              <Sparkles className="w-10 h-10 text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">SyncUp Messenger</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
              Select a conversation from the sidebar or click search to start a real-time 1-on-1 or group chat.
            </p>
          </div>
        )}
      </div>

      {/* Column 3: Chat Details Panel Drawer */}
      {activeChat && <ChatDetailsPanel chat={activeChat} />}

      {/* Global Application Modals */}
      <NewChatModal />
      <NewGroupModal />
    </div>
  );
};
