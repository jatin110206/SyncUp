const { Server } = require('socket.io');
const Chat = require('../model/chat');

let io;
// Map to store online users: userId -> socketId
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

        // Register user as online and auto-join all their chat rooms
        socket.on('user-online', async (userId) => {
            if (!userId) return;

            const uIdStr = userId.toString();
            onlineUsers.set(uIdStr, socket.id);
            socket.userId = uIdStr;

            // Join personal room for direct user-targeted socket broadcasts
            socket.join(uIdStr);
            console.log(`[Socket] User registered: ${uIdStr} (${socket.id})`);

            // Auto-join all chat rooms this user belongs to
            // so they receive real-time messages in ALL chats, not just the open one
            try {
                const userChats = await Chat.find(
                    { members: { $in: [userId] } },
                    { _id: 1 } // only need the IDs
                );
                const chatIds = userChats.map((c) => c._id.toString());
                for (const chatId of chatIds) {
                    socket.join(chatId);
                }
                console.log(`[Socket] User ${userId} auto-joined ${chatIds.length} chat rooms`);
            } catch (err) {
                console.error('[Socket] Error auto-joining chat rooms:', err.message);
            }

            // Broadcast updated online users list to ALL clients
            io.emit('get-online-users', Array.from(onlineUsers.keys()));
        });

        // Client requests current online users list (e.g. after reconnect)
        socket.on('request-online-users', () => {
            socket.emit('get-online-users', Array.from(onlineUsers.keys()));
        });

        // Join a specific chat room (still supported for when user opens a chat)
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
                console.log(`[Socket] Message relayed to room: ${data.chatId}`);
            }
        });

        // Real-time typing indicators
        socket.on('typing', async ({ chatId, userId, firstname }) => {
            if (chatId) {
                socket.to(chatId.toString()).emit('user-typing', { chatId, userId, firstname });
                try {
                    const chatObj = await Chat.findById(chatId);
                    if (chatObj && chatObj.members) {
                        chatObj.members.forEach((mId) => {
                            if (mId.toString() !== userId?.toString()) {
                                io.to(mId.toString()).emit('user-typing', { chatId, userId, firstname });
                            }
                        });
                    }
                } catch (err) {}
            }
        });

        socket.on('stop-typing', async ({ chatId, userId }) => {
            if (chatId) {
                socket.to(chatId.toString()).emit('user-stop-typing', { chatId, userId });
                try {
                    const chatObj = await Chat.findById(chatId);
                    if (chatObj && chatObj.members) {
                        chatObj.members.forEach((mId) => {
                            if (mId.toString() !== userId?.toString()) {
                                io.to(mId.toString()).emit('user-stop-typing', { chatId, userId });
                            }
                        });
                    }
                } catch (err) {}
            }
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`[Socket] User disconnected: ${socket.userId}`);
                io.emit('get-online-users', Array.from(onlineUsers.keys()));
            } else {
                console.log(`[Socket] Socket disconnected (anonymous): ${socket.id}`);
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
