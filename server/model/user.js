const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: null
    },
    profilePicture: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: '',
        maxlength: 200
    },
    status: {
        type: String,
        default: 'Hey there! I am using SyncUp.',
        maxlength: 100
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;