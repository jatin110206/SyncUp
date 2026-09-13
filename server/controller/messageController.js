const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../model/message');
const Chat = require('../model/chat');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────
// POST /api/message/newMessage
// Send a new message (text, image, or both)
// ─────────────────────────────────────────────────────────
router.post('/newMessage', authMiddleware, async (req, res) => {
    try {
        const { chatId, text, sender, image } = req.body || {};

        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required!' });
        }
        if (!text && !image) {
            return res.status(400).json({ message: 'Message must have text or an image!' });
        }

        const senderId = sender || req.userData?.userId || req.userData?.id;
        if (!senderId) {
            return res.status(400).json({ message: 'Sender ID is required!' });
        }

        // Block safeguard check for 1-on-1 chats
        const chatDoc = await Chat.findById(chatId);
        if (chatDoc && !chatDoc.isGroupChat && chatDoc.members) {
            const recipientId = chatDoc.members.find(m => m.toString() !== senderId.toString());
            if (recipientId) {
                const User = require('../model/user');
                const [senderUser, recipientUser] = await Promise.all([
                    User.findById(senderId),
                    User.findById(recipientId)
                ]);
                const senderBlocked = senderUser?.blockedUsers?.some(bId => bId.toString() === recipientId.toString());
                const recipientBlocked = recipientUser?.blockedUsers?.some(bId => bId.toString() === senderId.toString());
                if (senderBlocked || recipientBlocked) {
                    return res.status(403).json({ message: 'Messaging is disabled because one of you has blocked the other.' });
                }
            }
        }

        let imageUrl = null;

        // Upload base64 image to Cloudinary if provided
        if (image) {
            if (image.startsWith('data:')) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(image, {
                        folder: 'chat_images',
                        resource_type: 'image'
                    });
                    imageUrl = uploadResponse.secure_url;
                } catch (uploadErr) {
                    console.warn('Cloudinary upload failed, saving base64 directly:', uploadErr.message);
                    // Fallback: save the base64 data URL directly so the image still shows
                    imageUrl = image;
                }
            } else {
                imageUrl = image;
            }
        }

        const newMessage = new Message({
            chatId,
            sender: senderId,
            text: text || '',
            image: imageUrl
        });

        const savedMessage = await newMessage.save();

        // Update chat's lastMessage and increment unread count
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: text || '📷 Image',
            $inc: { unreadCount: 1 }
        });

        // Populate sender details for response
        const populated = await savedMessage.populate('sender', '-password');

        // Broadcast real-time message to all chat members via socket.io
        try {
            const { getIO } = require('../socket/socket');
            const io = getIO();
            const chatObj = await Chat.findById(chatId);
            if (chatObj && chatObj.members) {
                chatObj.members.forEach((mId) => {
                    const mStr = mId.toString();
                    io.to(mStr).emit('receive-message', populated);
                });
            }
            io.to(chatId.toString()).emit('receive-message', populated);
        } catch (socketErr) {
            console.error('[messageController] Socket broadcast error:', socketErr.message);
        }

        res.status(201).json({ message: populated });
    } catch (err) {
        console.error('Error sending new message:', err);
        res.status(500).json({ message: 'Sending new message failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/message/getMessages/:chatId OR /api/message/allMessages/:chatId
// Fetch all messages in a chat (oldest first)
// ─────────────────────────────────────────────────────────
router.get(['/getMessages/:chatId', '/allMessages/:chatId'], authMiddleware, async (req, res) => {
    try {
        const allMessages = await Message.find({ chatId: req.params.chatId })
            .populate('sender', '-password')
            .sort({ createdAt: 1 });

        res.status(200).json({ messages: allMessages });
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Fetching messages failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/message/markAsRead/:chatId OR /api/message/read/:chatId
// Mark all messages in a chat as read and reset unread count
// ─────────────────────────────────────────────────────────
const markAsReadHandler = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userData?.userId || req.userData?.id;

        await Message.updateMany(
            { chatId, read: false, sender: { $ne: userId } },
            { $set: { read: true } }
        );

        await Chat.findByIdAndUpdate(chatId, { $set: { unreadCount: 0 } });

        res.status(200).json({ message: 'Messages marked as read!' });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ message: 'Marking messages as read failed!', error: err.message });
    }
};

router.put(['/markAsRead/:chatId', '/read/:chatId'], authMiddleware, markAsReadHandler);
router.patch(['/markAsRead/:chatId', '/read/:chatId'], authMiddleware, markAsReadHandler);

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/message/editMessage/:messageId OR /api/message/:messageId
// Edit a message (sender only)
// ─────────────────────────────────────────────────────────
const editMessageHandler = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body || {};
        const userId = req.userData?.userId || req.userData?.id;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'New text is required to edit a message!' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found!' });
        }

        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only edit your own messages!' });
        }

        if (message.isDeleted) {
            return res.status(400).json({ message: 'Cannot edit a deleted message!' });
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { $set: { text: text.trim(), isEdited: true } },
            { returnDocument: 'after' }
        ).populate('sender', '-password');

        res.status(200).json({ message: 'Message edited successfully!', data: updatedMessage });
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).json({ message: 'Editing message failed!', error: err.message });
    }
};

router.put(['/editMessage/:messageId', '/:messageId'], authMiddleware, editMessageHandler);
router.patch(['/editMessage/:messageId', '/:messageId'], authMiddleware, editMessageHandler);

// ─────────────────────────────────────────────────────────
// DELETE /api/message/deleteMessage/:messageId OR /api/message/:messageId
// Soft delete a message (sender only)
// ─────────────────────────────────────────────────────────
router.delete(['/deleteMessage/:messageId', '/:messageId'], authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userData?.userId || req.userData?.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found!' });
        }

        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only delete your own messages!' });
        }

        const deletedMessage = await Message.findByIdAndUpdate(
            messageId,
            { $set: { text: 'This message was deleted', image: null, isDeleted: true } },
            { returnDocument: 'after' }
        ).populate('sender', '-password');

        res.status(200).json({ message: 'Message deleted successfully!', data: deletedMessage });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ message: 'Deleting message failed!', error: err.message });
    }
});

module.exports = router;
