import { create } from 'zustand';

export const usePresenceStore = create((set, get) => ({
  onlineUsers: new Set(),
  // Map of chatId -> Array of { userId, firstname } currently typing
  typingUsersByChat: {},

  setOnlineUsers: (usersArray) => {
    const normalized = (usersArray || []).map((u) =>
      (typeof u === 'object' && u !== null ? u._id || u.id || u : u).toString()
    );
    set({ onlineUsers: new Set(normalized) });
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const idStr = (
      typeof userId === 'object' && userId !== null ? userId._id || userId.id || userId : userId
    ).toString();
    return get().onlineUsers.has(idStr);
  },

  setUserTyping: ({ chatId, userId, firstname }) => {
    if (!chatId || !userId) return;
    const idStr = (typeof userId === 'object' && userId !== null ? userId._id || userId.id || userId : userId).toString();
    set((state) => {
      const currentList = state.typingUsersByChat[chatId] || [];
      const exists = currentList.some((u) => u.userId === idStr);
      if (exists) return state;
      return {
        typingUsersByChat: {
          ...state.typingUsersByChat,
          [chatId]: [...currentList, { userId: idStr, firstname: firstname || 'User' }],
        },
      };
    });
  },

  setUserStopTyping: ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    const idStr = (typeof userId === 'object' && userId !== null ? userId._id || userId.id || userId : userId).toString();
    set((state) => {
      const currentList = state.typingUsersByChat[chatId] || [];
      const filtered = currentList.filter((u) => u.userId !== idStr);
      return {
        typingUsersByChat: {
          ...state.typingUsersByChat,
          [chatId]: filtered,
        },
      };
    });
  },
}));
