import { create } from 'zustand';
import { chatService } from '../services/chatService';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  blockedByUsers: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  activeTab: 'all', // 'all' | 'unread' | 'groups'

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setUserBlockedMe: (blockerId, isBlocked, chatId = null) => {
    const bStr = blockerId ? blockerId.toString() : null;
    set((state) => {
      let newBlockedBy = state.blockedByUsers || [];
      if (bStr) {
        newBlockedBy = isBlocked
          ? Array.from(new Set([...newBlockedBy, bStr]))
          : newBlockedBy.filter((id) => id !== bStr);
      }

      // Update chats list
      const updatedChats = state.chats.map((c) => {
        const isMatch =
          (chatId && c._id === chatId) ||
          (!c.isGroupChat &&
            c.members?.some((m) => {
              const mId = (typeof m === 'object' && m !== null ? m._id || m.id || m : m)?.toString();
              return mId === bStr;
            }));

        if (isMatch) {
          return { ...c, isBlockedByOther: isBlocked };
        }
        return c;
      });

      // Update activeChat if affected
      let updatedActiveChat = state.activeChat;
      if (updatedActiveChat) {
        const isMatch =
          (chatId && updatedActiveChat._id === chatId) ||
          (!updatedActiveChat.isGroupChat &&
            updatedActiveChat.members?.some((m) => {
              const mId = (typeof m === 'object' && m !== null ? m._id || m.id || m : m)?.toString();
              return mId === bStr;
            }));

        if (isMatch) {
          updatedActiveChat = { ...updatedActiveChat, isBlockedByOther: isBlocked };
        }
      }

      return {
        blockedByUsers: newBlockedBy,
        chats: updatedChats,
        activeChat: updatedActiveChat,
      };
    });
  },

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await chatService.getChats();
      set({ chats: data.chats || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveChat: (chat) => {
    if (!chat) {
      set({ activeChat: null });
      return;
    }
    const existing = get().chats.find((c) => c._id === chat._id);
    const merged = existing ? { ...chat, isBlockedByOther: existing.isBlockedByOther ?? chat.isBlockedByOther } : chat;
    set({ activeChat: merged });
  },

  setActiveChatById: async (chatId) => {
    try {
      const data = await chatService.getChatById(chatId);
      set({ activeChat: data.chat });
      return data.chat;
    } catch (err) {
      console.error('[ChatStore] Error fetching chat by id:', err);
    }
  },

  createOneOnOneChat: async (recepientId) => {
    try {
      const data = await chatService.createChat(recepientId);
      const newChat = data.chat;
      
      const existing = get().chats.find((c) => c._id === newChat._id);
      if (!existing) {
        set({ chats: [newChat, ...get().chats], activeChat: newChat });
      } else {
        set({ activeChat: existing });
      }
      return newChat;
    } catch (err) {
      console.error('[ChatStore] Error creating 1-on-1 chat:', err);
      throw err;
    }
  },

  createGroupChat: async (groupName, memberIds) => {
    try {
      const data = await chatService.createGroupChat(groupName, memberIds);
      const groupChat = data.chat;
      set({ chats: [groupChat, ...get().chats], activeChat: groupChat });
      return groupChat;
    } catch (err) {
      console.error('[ChatStore] Error creating group chat:', err);
      throw err;
    }
  },

  clearUnreadCount: async (chatId) => {
    const targetChat = get().chats.find((c) => c._id === chatId);
    const activeChat = get().activeChat;
    
    // Guard against infinite loop: do not mutate state if unreadCount is already 0
    if ((!targetChat || targetChat.unreadCount === 0) && (!activeChat || activeChat._id !== chatId || activeChat.unreadCount === 0)) {
      return;
    }

    try {
      await chatService.clearUnread(chatId);
      set((state) => ({
        chats: state.chats.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c)),
        activeChat: state.activeChat?._id === chatId ? { ...state.activeChat, unreadCount: 0 } : state.activeChat,
      }));
    } catch (err) {
      console.error('[ChatStore] Error clearing unread count:', err);
    }
  },

  updateChatLastMessage: (chatId, lastMessageText, unread = false) => {
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c._id === chatId) {
          const currentUnread = unread && state.activeChat?._id !== chatId ? (c.unreadCount || 0) + 1 : c.unreadCount;
          return { ...c, lastMessage: lastMessageText, unreadCount: currentUnread, updatedAt: new Date().toISOString() };
        }
        return c;
      }),
    }));
  },

  renameGroup: async (chatId, groupName) => {
    const data = await chatService.renameGroup(chatId, groupName);
    set((state) => ({
      chats: state.chats.map((c) => (c._id === chatId ? { ...c, groupName } : c)),
      activeChat: state.activeChat?._id === chatId ? { ...state.activeChat, groupName } : state.activeChat,
    }));
    return data;
  },

  addGroupMembers: async (chatId, newMembers) => {
    const data = await chatService.addGroupMembers(chatId, newMembers);
    await get().fetchChats();
    if (get().activeChat?._id === chatId) {
      await get().setActiveChatById(chatId);
    }
    return data;
  },

  removeGroupMember: async (chatId, memberId) => {
    const data = await chatService.removeGroupMember(chatId, memberId);
    await get().fetchChats();
    if (get().activeChat?._id === chatId) {
      await get().setActiveChatById(chatId);
    }
    return data;
  },

  leaveGroup: async (chatId) => {
    await chatService.leaveGroup(chatId);
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
      activeChat: state.activeChat?._id === chatId ? null : state.activeChat,
    }));
  },
}));
