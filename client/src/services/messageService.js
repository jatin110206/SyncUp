import api from './api';

export const messageService = {
  newMessage: async (messageData) => {
    // messageData: { chatId, text, image }
    const response = await api.post('/api/message/newMessage', messageData);
    return response.data;
  },

  getMessages: async (chatId) => {
    const response = await api.get(`/api/message/getMessages/${chatId}`);
    return response.data;
  },

  markAsRead: async (chatId) => {
    const response = await api.put(`/api/message/markAsRead/${chatId}`);
    return response.data;
  },

  editMessage: async (messageId, text) => {
    const response = await api.put(`/api/message/editMessage/${messageId}`, { text });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/api/message/deleteMessage/${messageId}`);
    return response.data;
  },
};
