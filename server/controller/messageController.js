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

        let imageUrl = null;

        // If image is a base64 string, upload to Cloudinary
        if (image) {
            if (image.startsWith('data:')) {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'chat_images',
                    resource_type: 'image'
                });
                imageUrl = uploadResponse.secure_url;
            } else {
                // Assume it's already a URL
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

        res.status(201).json({ message: populated });
    } catch (err) {
        console.error('Error sending new message:', err);
        res.status(500).json({ message: 'Sending new message failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/message/allMessages/:chatId
// Fetch all messages in a chat (oldest first)
// ─────────────────────────────────────────────────────────
router.get('/allMessages/:chatId', authMiddleware, async (req, res) => {
    try {
        const allMessages = await Message.find({ chatId: req.params.chatId })
            .populate('sender', '-password')
            .sort({ createdAt: 1 });

        res.status(200).json({ messages: allMessages });
    } catch (err) {
        console.error('Error fetching all messages:', err);
        res.status(500).json({ message: 'Fetching messages failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/message/read/:chatId
// Mark all messages in a chat as read and reset unread count
// ─────────────────────────────────────────────────────────
router.patch('/read/:chatId', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userData?.userId || req.userData?.id;

        // Mark all unread messages not sent by the current user as read
        await Message.updateMany(
            { chatId, read: false, sender: { $ne: userId } },
            { $set: { read: true } }
        );

        // Reset the unread count on the chat
        await Chat.findByIdAndUpdate(chatId, { $set: { unreadCount: 0 } });

        res.status(200).json({ message: 'Messages marked as read!' });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ message: 'Marking messages as read failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/message/:messageId
// Edit a message (only the sender can edit, within their own messages)
// ─────────────────────────────────────────────────────────
router.patch('/:messageId', authMiddleware, async (req, res) => {
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

        // Ownership check
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

        res.status(200).json({ message: updatedMessage });
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).json({ message: 'Editing message failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/message/:messageId
// Soft delete a message (only the sender can delete)
// ─────────────────────────────────────────────────────────
router.delete('/:messageId', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userData?.userId || req.userData?.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found!' });
        }

        // Ownership check
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only delete your own messages!' });
        }

        // Soft delete: replace content, keep document for chat history integrity
        const deletedMessage = await Message.findByIdAndUpdate(
            messageId,
            { $set: { text: 'This message was deleted', image: null, isDeleted: true } },
            { returnDocument: 'after' }
        ).populate('sender', '-password');

        res.status(200).json({ message: deletedMessage });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ message: 'Deleting message failed!', error: err.message });
    }
});

module.exports = router;
