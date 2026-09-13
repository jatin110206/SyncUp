import { create } from 'zustand';
import { messageService } from '../services/messageService';
import { sendSocketMessage } from '../services/socket';
import { useChatStore } from './useChatStore';

export const useMessageStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  inChatSearchQuery: '',
  inChatSearchResults: [],
  currentSearchResultIndex: 0,

  setInChatSearchQuery: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      set({ inChatSearchQuery: '', inChatSearchResults: [], currentSearchResultIndex: 0 });
      return;
    }
    const matches = get().messages.filter(
      (m) => m.text && !m.isDeleted && m.text.toLowerCase().includes(q)
    );
    set({ inChatSearchQuery: query, inChatSearchResults: matches, currentSearchResultIndex: 0 });
  },

  nextSearchResult: () => {
    const { inChatSearchResults, currentSearchResultIndex } = get();
    if (inChatSearchResults.length === 0) return;
    set({ currentSearchResultIndex: (currentSearchResultIndex + 1) % inChatSearchResults.length });
  },

  prevSearchResult: () => {
    const { inChatSearchResults, currentSearchResultIndex } = get();
    if (inChatSearchResults.length === 0) return;
    set({
      currentSearchResultIndex:
        (currentSearchResultIndex - 1 + inChatSearchResults.length) % inChatSearchResults.length,
    });
  },

  fetchMessages: async (chatId) => {
    set({ isLoading: true, error: null, messages: [] });
    try {
      const data = await messageService.getMessages(chatId);
      set({ messages: data.messages || [], isLoading: false });
      
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat && activeChat.unreadCount > 0) {
        await messageService.markAsRead(chatId);
        useChatStore.getState().clearUnreadCount(chatId);
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  sendMessage: async (chatId, text, image) => {
    // Add an optimistic placeholder message with status 'sending'
    const tempId = `temp-${Date.now()}`;
    const { useAuthStore } = await import('./useAuthStore');
    const currentUser = useAuthStore.getState().user;
    const optimisticMsg = {
      _id: tempId,
      chatId,
      text: text || '',
      image: image || null,
      sender: currentUser,
      read: false,
      isDeleted: false,
      isEdited: false,
      _sending: true, // our local flag
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, optimisticMsg] }));

    try {
      const data = await messageService.newMessage({ chatId, text, image });
      const createdMessage = data.message;

      // Replace the optimistic message with the real one from the server
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? { ...createdMessage, _sending: false } : m
        ),
      }));

      const displayContent = image && !text ? '📷 Image' : text;
      useChatStore.getState().updateChatLastMessage(chatId, displayContent);

      sendSocketMessage(createdMessage);

      return createdMessage;
    } catch (err) {
      // Mark the optimistic message as failed
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? { ...m, _failed: true, _sending: false } : m
        ),
      }));
      console.error('[MessageStore] Error sending message:', err);
      throw err;
    }
  },

  handleIncomingSocketMessage: (incomingMessage) => {
    const activeChat = useChatStore.getState().activeChat;
    const isForActiveChat = activeChat && activeChat._id === incomingMessage.chatId;

    if (isForActiveChat) {
      set((state) => {
        const exists = state.messages.some((m) => m._id === incomingMessage._id);
        if (exists) return state;
        return { messages: [...state.messages, incomingMessage] };
      });
      messageService.markAsRead(incomingMessage.chatId).catch(() => {});
      useChatStore.getState().updateChatLastMessage(
        incomingMessage.chatId,
        incomingMessage.image && !incomingMessage.text ? '📷 Image' : incomingMessage.text,
        false
      );
    } else {
      useChatStore.getState().updateChatLastMessage(
        incomingMessage.chatId,
        incomingMessage.image && !incomingMessage.text ? '📷 Image' : incomingMessage.text,
        true
      );
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const data = await messageService.editMessage(messageId, newText);
      const updatedMsg = data.data;
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, ...updatedMsg } : m)),
      }));
    } catch (err) {
      console.error('[MessageStore] Edit message error:', err);
      throw err;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const data = await messageService.deleteMessage(messageId);
      const deletedMsg = data.data;
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, ...deletedMsg } : m)),
      }));
    } catch (err) {
      console.error('[MessageStore] Delete message error:', err);
      throw err;
    }
  },
}));
