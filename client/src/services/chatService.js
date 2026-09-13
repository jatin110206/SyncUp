import api from './api';

export const chatService = {
  // CRITICAL CONTRACT: Parameter must remain 'recepientId' exactly
  createChat: async (recepientId) => {
    const response = await api.post('/api/chat/createChat', { recepientId });
    return response.data;
  },

  createGroupChat: async (groupName, members) => {
    const response = await api.post('/api/chat/createGroupChat', { groupName, members });
    return response.data;
  },

  getChats: async () => {
    const response = await api.get('/api/chat/getChats');
    return response.data;
  },

  getChatById: async (chatId) => {
    const response = await api.get(`/api/chat/getChat/${chatId}`);
    return response.data;
  },

  clearUnread: async (chatId) => {
    const response = await api.put('/api/chat/clearUnread', { chatId });
    return response.data;
  },

  renameGroup: async (chatId, groupName) => {
    const response = await api.put('/api/chat/renameGroup', { chatId, groupName });
    return response.data;
  },

  addGroupMembers: async (chatId, members) => {
    const response = await api.put('/api/chat/addGroupMembers', { chatId, members });
    return response.data;
  },

  removeGroupMember: async (chatId, memberId) => {
    const response = await api.put('/api/chat/removeGroupMember', { chatId, memberId });
    return response.data;
  },

  leaveGroup: async (chatId) => {
    const response = await api.put('/api/chat/leaveGroup', { chatId });
    return response.data;
  },
};
