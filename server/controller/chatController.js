const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../model/chat');

// ─────────────────────────────────────────────────────────
// POST /api/chat/createChat OR /api/chat/createNewChat
// Create or retrieve a 1-on-1 chat between two users
// Supports { recepientId } OR { members }
// ─────────────────────────────────────────────────────────
router.post(['/createChat', '/createNewChat'], authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        let { recepientId, recipientId, targetUserId, members } = req.body || {};

        const targetId = recepientId || recipientId || targetUserId;

        if (!members && targetId) {
            members = [userId.toString(), targetId.toString()];
        }

        if (!members || members.length < 2) {
            return res.status(400).json({ message: 'Recepient ID or at least 2 members are required!' });
        }

        // Check if 1-on-1 chat already exists between these users
        if (members.length === 2) {
            const existingChat = await Chat.findOne({
                isGroupChat: false,
                members: { $all: members, $size: 2 }
            }).populate('members', '-password');

            if (existingChat) {
                const uIdStr = userId.toString();
                const chatObj = existingChat.toObject();
                if (!existingChat.isGroupChat && existingChat.members) {
                    const other = existingChat.members.find((m) => (m._id || m.id || m)?.toString() !== uIdStr);
                    chatObj.isBlockedByOther = Boolean(other?.blockedUsers?.some((bId) => (bId?._id || bId)?.toString() === uIdStr));
                }
                return res.status(200).json({ chat: chatObj, alreadyExists: true });
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

        try {
            const { getIO } = require('../socket/socket');
            const io = getIO();
            populated.members.forEach((m) => {
                const mId = (m._id || m.id || m).toString();
                io.to(mId).emit('new-chat-created', populated);
            });
        } catch (sErr) {
            console.error('[chatController] Socket emit error:', sErr.message);
        }

        res.status(201).json({ chat: populated });
    } catch (err) {
        console.error('Error creating new chat:', err);
        res.status(500).json({ message: 'Creating new chat failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/chat/getChats OR /api/chat/allChats
// Get all chats the authenticated user is part of
// ─────────────────────────────────────────────────────────
router.get(['/getChats', '/allChats'], authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token!' });
        }

        const uIdStr = userId.toString();
        const chats = await Chat.find({ members: { $in: [userId] } })
            .populate('members', '-password')
            .populate('groupAdmin', '-password')
            .sort({ updatedAt: -1 });

        const formattedChats = chats.map((chat) => {
            const chatObj = chat.toObject();
            if (!chat.isGroupChat && chat.members) {
                const other = chat.members.find((m) => m._id?.toString() !== uIdStr);
                chatObj.isBlockedByOther = other?.blockedUsers?.some((bId) => bId.toString() === uIdStr) || false;
            }
            return chatObj;
        });

        res.status(200).json({ chats: formattedChats });
    } catch (err) {
        console.error('Error fetching all chats:', err);
        res.status(500).json({ message: 'Fetching chats failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/chat/getChat/:chatId
// Fetch a single chat by ID
// ─────────────────────────────────────────────────────────
router.get('/getChat/:chatId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        const chat = await Chat.findById(req.params.chatId)
            .populate('members', '-password')
            .populate('groupAdmin', '-password');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found!' });
        }

        const uIdStr = userId ? userId.toString() : '';
        const chatObj = chat.toObject();
        if (!chat.isGroupChat && chat.members) {
            const other = chat.members.find((m) => m._id?.toString() !== uIdStr);
            chatObj.isBlockedByOther = other?.blockedUsers?.some((bId) => bId.toString() === uIdStr) || false;
        }

        res.status(200).json({ chat: chatObj });
    } catch (err) {
        console.error('Error fetching chat:', err);
        res.status(500).json({ message: 'Fetching chat failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/chat/clearUnread OR /api/chat/clearUnread/:chatId
// Clear unread message count for a chat
// ─────────────────────────────────────────────────────────
const clearUnreadHandler = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body?.chatId;
        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required!' });
        }

        const chat = await Chat.findByIdAndUpdate(
            chatId,
            { $set: { unreadCount: 0 } },
            { returnDocument: 'after' }
        ).populate('members', '-password');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found!' });
        }

        res.status(200).json({ message: 'Unread count cleared!', chat });
    } catch (err) {
        console.error('Error clearing unread count:', err);
        res.status(500).json({ message: 'Clearing unread count failed!', error: err.message });
    }
};

router.put(['/clearUnread', '/clearUnread/:chatId'], authMiddleware, clearUnreadHandler);
router.patch(['/clearUnread', '/clearUnread/:chatId'], authMiddleware, clearUnreadHandler);

// ─────────────────────────────────────────────────────────
// POST /api/chat/createGroupChat
// Create a group chat with name and members
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

        res.status(201).json({ message: 'Group chat created successfully!', chat: populated });
    } catch (err) {
        console.error('Error creating group chat:', err);
        res.status(500).json({ message: 'Creating group chat failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/chat/renameGroup OR /api/chat/renameGroup/:chatId
// Rename a group chat (admin only)
// ─────────────────────────────────────────────────────────
const renameGroupHandler = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body?.chatId;
        const { groupName } = req.body || {};
        const userId = req.userData?.userId || req.userData?.id;

        if (!chatId) return res.status(400).json({ message: 'Chat ID is required!' });
        if (!groupName || !groupName.trim()) return res.status(400).json({ message: 'Group name is required!' });

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can rename the group!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $set: { groupName: groupName.trim() } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ message: 'Group name updated successfully!', chat: updated });
    } catch (err) {
        console.error('Error renaming group:', err);
        res.status(500).json({ message: 'Renaming group failed!', error: err.message });
    }
};

router.put(['/renameGroup', '/renameGroup/:chatId'], authMiddleware, renameGroupHandler);
router.patch(['/renameGroup', '/renameGroup/:chatId'], authMiddleware, renameGroupHandler);

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/chat/addGroupMembers OR /api/chat/addToGroup/:chatId
// Add member(s) to a group chat (admin only)
// ─────────────────────────────────────────────────────────
const addMembersHandler = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body?.chatId;
        const { userId: newMemberId, members } = req.body || {};
        const requesterId = req.userData?.userId || req.userData?.id;

        const toAdd = members || (newMemberId ? [newMemberId] : []);
        if (!chatId || toAdd.length === 0) {
            return res.status(400).json({ message: 'Chat ID and member(s) are required!' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== requesterId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can add members!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { members: { $each: toAdd } } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ message: 'Members added successfully!', chat: updated });
    } catch (err) {
        console.error('Error adding members:', err);
        res.status(500).json({ message: 'Adding members failed!', error: err.message });
    }
};

router.put(['/addGroupMembers', '/addToGroup', '/addToGroup/:chatId'], authMiddleware, addMembersHandler);
router.patch(['/addGroupMembers', '/addToGroup', '/addToGroup/:chatId'], authMiddleware, addMembersHandler);

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/chat/removeGroupMember OR /api/chat/removeFromGroup/:chatId
// Remove member from group chat (admin only)
// ─────────────────────────────────────────────────────────
const removeMemberHandler = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body?.chatId;
        const removeMemberId = req.body?.memberId || req.body?.userId;
        const requesterId = req.userData?.userId || req.userData?.id;

        if (!chatId || !removeMemberId) {
            return res.status(400).json({ message: 'Chat ID and member ID are required!' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });
        if (chat.groupAdmin.toString() !== requesterId.toString()) {
            return res.status(403).json({ message: 'Only the group admin can remove members!' });
        }

        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { members: removeMemberId } },
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ message: 'Member removed successfully!', chat: updated });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ message: 'Removing member failed!', error: err.message });
    }
};

router.put(['/removeGroupMember', '/removeFromGroup', '/removeFromGroup/:chatId'], authMiddleware, removeMemberHandler);
router.patch(['/removeGroupMember', '/removeFromGroup', '/removeFromGroup/:chatId'], authMiddleware, removeMemberHandler);

// ─────────────────────────────────────────────────────────
// PUT or PATCH /api/chat/leaveGroup OR /api/chat/leaveGroup/:chatId
// Leave group chat
// ─────────────────────────────────────────────────────────
const leaveGroupHandler = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body?.chatId;
        const userId = req.userData?.userId || req.userData?.id;

        if (!chatId) return res.status(400).json({ message: 'Chat ID is required!' });

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found!' });
        if (!chat.isGroupChat) return res.status(400).json({ message: 'This is not a group chat!' });

        const updatePayload = { $pull: { members: userId } };
        const memberIds = chat.members.map(m => m.toString());

        if (chat.groupAdmin.toString() === userId.toString()) {
            const nextAdmin = memberIds.find(id => id !== userId.toString());
            if (nextAdmin) {
                updatePayload.$set = { groupAdmin: nextAdmin };
            }
        }

        const updated = await Chat.findByIdAndUpdate(
            chatId,
            updatePayload,
            { returnDocument: 'after' }
        ).populate([
            { path: 'members', select: '-password' },
            { path: 'groupAdmin', select: '-password' }
        ]);

        res.status(200).json({ message: 'You have left the group chat.', chat: updated });
    } catch (err) {
        console.error('Error leaving group:', err);
        res.status(500).json({ message: 'Leaving group failed!', error: err.message });
    }
};

router.put(['/leaveGroup', '/leaveGroup/:chatId'], authMiddleware, leaveGroupHandler);
router.patch(['/leaveGroup', '/leaveGroup/:chatId'], authMiddleware, leaveGroupHandler);

module.exports = router;