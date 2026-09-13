const router = require('express').Router();
const User = require('../model/user');
const authMiddleware = require('../middleware/authMiddleware');

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

router.get('/all',authMiddleware, async (req, res) => {
    try {
        const users = await User.find({_id:{ $ne: req.userId }}).select('-password');
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error fetching all users:', err);
        res.status(500).json({ message: 'Fetching users failed!', error: err.message });
    }
});

module.exports = router;