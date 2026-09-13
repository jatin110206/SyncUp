import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let socket = null;

/**
 * Connect to Socket.io and register all event listeners.
 * Safe to call multiple times — always refreshes listeners without creating duplicates.
 * Handles the case where the socket is already connected (e.g. after React remount).
 */
export const connectSocket = (userId, callbacks = {}) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }

  // Always wipe old listeners to prevent duplicates on remount
  socket.off('connect');
  socket.off('disconnect');
  socket.off('reconnect');
  socket.off('get-online-users');
  socket.off('receive-message');
  socket.off('user-typing');
  socket.off('user-stop-typing');
  socket.off('new-chat-created');
  socket.off('user-blocked');
  socket.off('user-unblocked');
  socket.off('chat-block-updated');

  // ─── Core connection handlers ────────────────────────────────────────────────

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    if (userId) {
      // Emit user-online: server will auto-join all chat rooms and broadcast online list
      socket.emit('user-online', userId);
    }
    if (callbacks.onConnect) callbacks.onConnect();
  });

  socket.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempt(s)');
    if (userId) {
      socket.emit('user-online', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    if (callbacks.onDisconnect) callbacks.onDisconnect(reason);
  });

  // ─── Feature event handlers ──────────────────────────────────────────────────

  socket.on('get-online-users', (usersList) => {
    console.log('[Socket] Online users update:', usersList);
    if (callbacks.onOnlineUsersUpdate) callbacks.onOnlineUsersUpdate(usersList);
  });

  socket.on('receive-message', (data) => {
    console.log('[Socket] Received message:', data?._id, 'for chat:', data?.chatId);
    if (callbacks.onReceiveMessage) callbacks.onReceiveMessage(data);
  });

  socket.on('user-typing', (data) => {
    if (callbacks.onUserTyping) callbacks.onUserTyping(data);
  });

  socket.on('user-stop-typing', (data) => {
    if (callbacks.onUserStopTyping) callbacks.onUserStopTyping(data);
  });

  socket.on('new-chat-created', (data) => {
    console.log('[Socket] New chat created:', data?._id);
    if (callbacks.onNewChatCreated) callbacks.onNewChatCreated(data);
  });

  socket.on('user-blocked', (data) => {
    console.log('[Socket] User blocked event:', data);
    if (callbacks.onUserBlocked) callbacks.onUserBlocked(data);
  });

  socket.on('user-unblocked', (data) => {
    console.log('[Socket] User unblocked event:', data);
    if (callbacks.onUserUnblocked) callbacks.onUserUnblocked(data);
  });

  socket.on('chat-block-updated', (data) => {
    console.log('[Socket] Chat block updated event:', data);
    if (callbacks.onChatBlockUpdated) callbacks.onChatBlockUpdated(data);
  });

  // ─── If already connected, re-register user immediately ─────────────────────
  // (handles React remount when the socket singleton is still alive)
  if (socket.connected) {
    console.log('[Socket] Already connected — re-registering user:', userId);
    if (userId) {
      socket.emit('user-online', userId);
    }
    // Ask server to re-send the current online users list
    socket.emit('request-online-users');
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Join a single chat room (called when the user opens a specific chat) */
export const joinChatRoom = (chatId) => {
  if (socket && socket.connected && chatId) {
    socket.emit('join-chat', chatId);
  }
};

/** Leave a single chat room (called when the user closes a chat) */
export const leaveChatRoom = (chatId) => {
  if (socket && socket.connected && chatId) {
    socket.emit('leave-chat', chatId);
  }
};

/** Emit a message to the server for relay to other chat members */
export const sendSocketMessage = (messageData) => {
  if (socket && socket.connected && messageData) {
    socket.emit('send-message', messageData);
  }
};

export const emitTyping = (chatId, userId, firstname) => {
  if (socket && socket.connected && chatId) {
    socket.emit('typing', { chatId, userId, firstname });
  }
};

export const emitStopTyping = (chatId, userId) => {
  if (socket && socket.connected && chatId) {
    socket.emit('stop-typing', { chatId, userId });
  }
};

export const getSocketInstance = () => socket;
