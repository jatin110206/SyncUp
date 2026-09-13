import api from './api';

export const authService = {
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
};
