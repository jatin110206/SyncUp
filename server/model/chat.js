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
    
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;