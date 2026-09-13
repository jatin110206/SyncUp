const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    lastMessage: {
        type: String,
        default: "",
    },
    unreadCount: {
        type: Number,
        default: 0,
    },
    // Group chat fields
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    groupName: {
        type: String,
        default: null,
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;