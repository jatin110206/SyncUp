const { Server } = require('socket.io');

let io;
// Map to store online users: userId -> socket.id
const onlineUsers = new Map();

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3000',
                process.env.CLIENT_URL
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // Register user as online
        socket.on('user-online', (userId) => {
            if (userId) {
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                console.log(`[Socket] User registered: ${userId} (${socket.id})`);
                // Broadcast updated online users list
                io.emit('get-online-users', Array.from(onlineUsers.keys()));
            }
        });

        // Join a specific chat room
        socket.on('join-chat', (chatId) => {
            if (chatId) {
                socket.join(chatId);
                console.log(`[Socket] Socket ${socket.id} joined chat room: ${chatId}`);
            }
        });

        // Leave a chat room
        socket.on('leave-chat', (chatId) => {
            if (chatId) {
                socket.leave(chatId);
                console.log(`[Socket] Socket ${socket.id} left chat room: ${chatId}`);
            }
        });

        // Relay new message to other members in the chat room
        socket.on('send-message', (data) => {
            if (data && data.chatId) {
                // Broadcast to everyone in the chat room except the sender
                socket.to(data.chatId).emit('receive-message', data);
            }
        });

        // Real-time typing indicators
        socket.on('typing', ({ chatId, userId, firstname }) => {
            if (chatId) {
                socket.to(chatId).emit('user-typing', { chatId, userId, firstname });
            }
        });

        socket.on('stop-typing', ({ chatId, userId }) => {
            if (chatId) {
                socket.to(chatId).emit('user-stop-typing', { chatId, userId });
            }
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`[Socket] User disconnected: ${socket.userId}`);
                io.emit('get-online-users', Array.from(onlineUsers.keys()));
            } else {
                console.log(`[Socket] Socket disconnected: ${socket.id}`);
            }
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet!');
    }
    return io;
}

function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}

module.exports = {
    initSocket,
    getIO,
    getOnlineUsers
};
