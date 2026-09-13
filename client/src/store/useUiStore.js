import { create } from 'zustand';

export const useUiStore = create((set, get) => ({
  theme: localStorage.getItem('syncup_theme') || 'dark',
  isCommandPaletteOpen: false,
  isNewChatModalOpen: false,
  isNewGroupModalOpen: false,
  isChatDetailsOpen: false,
  lightboxImage: null, // string URL or null
  toasts: [], // Array of { id, message, type: 'info'|'success'|'error', duration }

  setTheme: (theme) => {
    localStorage.setItem('syncup_theme', theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  setNewChatModalOpen: (open) => set({ isNewChatModalOpen: open }),
  setNewGroupModalOpen: (open) => set({ isNewGroupModalOpen: open }),
  setChatDetailsOpen: (open) => set({ isChatDetailsOpen: open }),
  toggleChatDetails: () => set((state) => ({ isChatDetailsOpen: !state.isChatDetailsOpen })),

  setLightboxImage: (url) => set({ lightboxImage: url }),

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, message, type };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
