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
    lastMessageTime: {
        type: Date,
        default: null,
    },
}
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;