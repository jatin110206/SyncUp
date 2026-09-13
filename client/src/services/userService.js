import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/api/user/all');
    return response.data;
  },

  searchUsers: async (query, page = 1, limit = 10) => {
    const response = await api.get(`/api/user/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/api/user/${userId}`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/user/updateProfile', profileData);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      throw new Error(msg);
    }
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/api/user/changePassword', passwordData);
    return response.data;
  },

  uploadProfilePicture: async (imageData) => {
    const response = await api.post('/api/user/uploadProfilePicture', { image: imageData });
    return response.data;
  },

  blockUser: async (targetUserId) => {
    const response = await api.post(`/api/user/block/${targetUserId}`);
    return response.data;
  },

  unblockUser: async (targetUserId) => {
    const response = await api.post(`/api/user/unblock/${targetUserId}`);
    return response.data;
  },

  getBlockedUsers: async () => {
    const response = await api.get('/api/user/blocked');
    return response.data;
  },
};
