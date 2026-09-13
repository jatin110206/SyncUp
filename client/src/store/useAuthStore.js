import { create } from 'zustand';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const initialToken = localStorage.getItem('syncup_token') || null;
const initialUser = localStorage.getItem('syncup_user')
  ? JSON.parse(localStorage.getItem('syncup_user'))
  : null;

export const useAuthStore = create((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('syncup_token', token);
    localStorage.setItem('syncup_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, error: null });
  },

  updateUser: (updatedFields) => {
    const updatedUser = { ...get().user, ...updatedFields };
    localStorage.setItem('syncup_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      // Fetch full user profile after getting token
      localStorage.setItem('syncup_token', data.token);
      const profileData = await userService.getProfile();
      const user = profileData.user;
      
      localStorage.setItem('syncup_user', JSON.stringify(user));
      set({ user, token: data.token, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.signup(userData);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  fetchProfile: async () => {
    if (!get().token) return;
    try {
      const data = await userService.getProfile();
      if (data.user) {
        localStorage.setItem('syncup_user', JSON.stringify(data.user));
        set({ user: data.user });
      }
    } catch (err) {
      console.error('[AuthStore] Failed to refresh profile:', err);
    }
  },

  logout: () => {
    localStorage.removeItem('syncup_token');
    localStorage.removeItem('syncup_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  blockUser: async (targetUserId) => {
    try {
      const data = await userService.blockUser(targetUserId);
      const updatedUser = { ...get().user, blockedUsers: data.blockedUsers };
      localStorage.setItem('syncup_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return data;
    } catch (err) {
      console.error('[AuthStore] Block user failed:', err);
      throw err;
    }
  },

  unblockUser: async (targetUserId) => {
    try {
      const data = await userService.unblockUser(targetUserId);
      const updatedUser = { ...get().user, blockedUsers: data.blockedUsers };
      localStorage.setItem('syncup_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return data;
    } catch (err) {
      console.error('[AuthStore] Unblock user failed:', err);
      throw err;
    }
  },

  isUserBlocked: (targetUserId) => {
    if (!targetUserId) return false;
    const blockedList = get().user?.blockedUsers || [];
    const targetStr = (typeof targetUserId === 'object' ? targetUserId._id || targetUserId.id || targetUserId : targetUserId).toString();
    return blockedList.some((id) => (typeof id === 'object' ? id._id || id.id || id : id).toString() === targetStr);
  },
}));
