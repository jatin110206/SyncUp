const router = require('express').Router();
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────
// GET /api/user/profile
// Get the authenticated user's own profile
// ─────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token!' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Fetching user failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/user/all
// Get all users except the currently authenticated user
// ─────────────────────────────────────────────────────────
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        const users = await User.find({ _id: { $ne: userId } }).select('-password');
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error fetching all users:', err);
        res.status(500).json({ message: 'Fetching users failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/user/search?q=<query>&page=1&limit=10
// Search users by firstname, lastname, or email (excludes self)
// Supports pagination via ?page and ?limit query params
// ─────────────────────────────────────────────────────────
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        const query = (req.query.q || '').trim();
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({ message: 'Search query (q) is required!' });
        }

        // Case-insensitive partial match on firstname, lastname, or email
        const searchRegex = new RegExp(query, 'i');
        const filter = {
            _id: { $ne: userId },
            $or: [
                { firstname: searchRegex },
                { lastname: searchRegex },
                { email: searchRegex }
            ]
        };

        const [users, total] = await Promise.all([
            User.find(filter).select('-password').skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ message: 'Searching users failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/user/:userId
// Get a specific user's public profile by their ID
// ─────────────────────────────────────────────────────────
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ message: 'Fetching user failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PUT /api/user/updateProfile
// Update authenticated user's firstname, lastname, bio, status
// ─────────────────────────────────────────────────────────
router.put('/updateProfile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        const { firstname, lastname, bio, status } = req.body || {};

        // Build only the fields that were provided
        const updates = {};
        if (firstname !== undefined) {
            if (!firstname.trim()) return res.status(400).json({ message: 'First name cannot be empty!' });
            updates.firstname = firstname.trim();
        }
        if (lastname !== undefined) {
            if (!lastname.trim()) return res.status(400).json({ message: 'Last name cannot be empty!' });
            updates.lastname = lastname.trim();
        }
        if (bio !== undefined) {
            if (bio.length > 200) return res.status(400).json({ message: 'Bio cannot exceed 200 characters!' });
            updates.bio = bio.trim();
        }
        if (status !== undefined) {
            if (status.length > 100) return res.status(400).json({ message: 'Status cannot exceed 100 characters!' });
            updates.status = status.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update!' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { returnDocument: 'after' }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }

        res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Updating profile failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// PUT /api/user/changePassword
// Change password for authenticated user
// Requires: currentPassword, newPassword, confirmPassword
// ─────────────────────────────────────────────────────────
router.put('/changePassword', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        const { currentPassword, newPassword, confirmPassword } = req.body || {};

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Current password, new password, and confirm password are required!' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match!' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters!' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from the current password!' });
        }

        // Fetch user including password for comparison
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect!' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });

        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Changing password failed!', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/user/uploadProfilePicture
// Upload profile picture to Cloudinary and update profile
// ─────────────────────────────────────────────────────────
router.post('/uploadProfilePicture', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData?.userId || req.userData?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token!' });
        }

        const { image } = req.body || {};
        if (!image) {
            return res.status(400).json({ message: 'Image data is required!' });
        }

        // Upload the image to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: 'profile_pictures',
            public_id: `user_${userId}`,
            overwrite: true,
            resource_type: 'image'
        });

        // Update the user's profile picture URL in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: uploadResponse.secure_url, profileImage: uploadResponse.secure_url },
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json({ message: 'Profile picture updated successfully!', user: updatedUser });
    } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ message: 'Uploading profile picture failed!', error: err.message });
    }
});

module.exports = router;