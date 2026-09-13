const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../model/chat');

// ─────────────────────────────────────────────────────────
// POST /api/chat/createNewChat
// Create a one-on-one chat between two users
// ─────────────────────────────────────────────────────────
router.post('/createNewChat', authMiddleware, async (req, res) => {
    try {
        const { members } = req.body || {};

        if (!members || members.length < 2) {
            return res.status(400).json({ message: 'At least 2 members are required to create a chat!' });
        }

        // Check if 1-on-1 chat already exists between these two users
        if (members.length === 2) {
            const existingChat = await Chat.findOne({
                isGroupChat: false,
                members: { $all: members, $size: 2 }
            }).populate('members', '-password');

            if (existingChat) {
                return res.status(200).json({ chat: existingChat, alreadyExists: true });
            }
        }

        const chat = new Chat({
            members,
            lastMessage: '',
            unreadCount: 0,
            isGroupChat: false
        });

        const savedChat = await chat.save();
        const populated = await savedChat.populate('members', '-password');

        res.status(201).json({ chat: populated });
    } catch (err) {
        console.error('Error creating new chat:', err);
        res.status(500).json({ message: 'Creating new chat failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/chat/allChats
// Get all chats the authenticated user is part of
// ─────────────────────────────────────────────────────────
router.get('/allChats', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token!' });
        }

        const chats = await Chat.find({ members: { $in: [userId] } })
            .populate('members', '-password')
            .populate('groupAdmin', '-password')
            .sort({ updatedAt: -1 });

        res.status(200).json({ chats });
    } catch (err) {
        console.error('Error fetching all chats:', err);
        res.status(500).json({ message: 'Fetching chats failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/chat/clearUnread/:chatId
// Clear unread message count for a specific chat
// ─────────────────────────────────────────────────────────
router.patch('/clearUnread/:chatId', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { $set: { unreadCount: 0 } },
            { returnDocument: 'after' }
        ).populate('members', '-password');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found!' });
        }

        res.status(200).json({ chat });
    } catch (err) {
        console.error('Error clearing unread count:', err);
        res.status(500).json({ message: 'Clearing unread count failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/chat/createGroupChat
// Create a group chat with a name and multiple members
// ─────────────────────────────────────────────────────────
router.post('/createGroupChat', authMiddleware, async (req, res) => {
    try {
        const { groupName, members } = req.body || {};
        const adminId = req.userData?.userId || req.userData?.id;

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ message: 'Group name is required!' });
        }
        if (!members || members.length < 2) {
            return res.status(400).json({ message: 'A group requires at least 2 other members!' });
        }

        // Add admin to members if not already included
        const allMembers = members.includes(adminId.toString())
            ? members
            : [adminId.toString(), ...members];

        const groupChat = new Chat({
            groupName: groupName.trim(),
            members: allMembers,
            isGroupChat: true,
            groupAdmin: adminId,
            lastMessage: '',
            unreadCount: 0
        });

        const savedChat = await groupChat.save();
        const populated = await savedChat.populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(201).json({ chat: populated });
    } catch (err) {
        console.error('Error creating group chat:', err);
        res.status(500).json({ message: 'Creating group chat failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/chat/renameGroup/:chatId
// Rename a group chat (admin only)
// ─────────────────────────────────────────────────────────
router.patch('/renameGroup/:chatId', authMiddleware, async (req, res) => {
    try {
        const { groupName } = req.body || {};
        const userId = req.userData?.userId || req.userData?.id;

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ message: 'New group name is required!' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can rename the group!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { $set: { groupName: groupName.trim() } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ chat: updated });
    } catch (err) {
        console.error('Error renaming group:', err);
        res.status(500).json({ message: 'Renaming group failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/chat/addToGroup/:chatId
// Add a member to a group chat (admin only)
// ─────────────────────────────────────────────────────────
router.patch('/addToGroup/:chatId', authMiddleware, async (req, res) => {
    try {
        const { userId: newMemberId } = req.body || {};
        const requesterId = req.userData?.userId || req.userData?.id;

        if (!newMemberId) {
            return res.status(400).json({ message: 'User ID to add is required!' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== requesterId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can add members!' });
        }
        if (chat.members.map(m => m.toString()).includes(newMemberId)) {
            return res.status(400).json({ message: 'User is already in the group!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { $push: { members: newMemberId } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ chat: updated });
    } catch (err) {
        console.error('Error adding member to group:', err);
        res.status(500).json({ message: 'Adding member to group failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/chat/removeFromGroup/:chatId
// Remove a member from a group chat (admin only)
// ─────────────────────────────────────────────────────────
router.patch('/removeFromGroup/:chatId', authMiddleware, async (req, res) => {
    try {
        const { userId: removeMemberId } = req.body || {};
        const requesterId = req.userData?.userId || req.userData?.id;

        if (!removeMemberId) {
            return res.status(400).json({ message: 'User ID to remove is required!' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== requesterId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can remove members!' });
        }
        if (chat.groupAdmin.toString() === removeMemberId) {
            return res.status(400).json({ message: 'Admin cannot be removed from the group!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { $pull: { members: removeMemberId } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ chat: updated });
    } catch (err) {
        console.error('Error removing member from group:', err);
        res.status(500).json({ message: 'Removing member from group failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/chat/leaveGroup/:chatId
// Leave a group chat (any member can leave; if admin leaves, assign new admin)
// ─────────────────────────────────────────────────────────
router.patch('/leaveGroup/:chatId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });

        const memberIds = chat.members.map(m => m.toString());
        if (!memberIds.includes(userId.toString())) {
            return res.status(400).json({ message: 'You are not a member of this group!' });
        }

        const updatePayload = { $pull: { members: userId } };

        // If admin is leaving, assign admin role to next member
        if (chat.groupAdmin.toString() === userId.toString()) {
            const nextAdmin = memberIds.find(id => id !== userId.toString());
            if (nextAdmin) {
                updatePayload.$set = { groupAdmin: nextAdmin };
            }
        }

        const updated = await Chat.findByIdAndUpdate(
            req.params.chatId,
            updatePayload,
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ message: 'Left the group successfully!', chat: updated });
    } catch (err) {
        console.error('Error leaving group:', err);
        res.status(500).json({ message: 'Leaving group failed!', error: err.message });
    }
});

module.exports = router;