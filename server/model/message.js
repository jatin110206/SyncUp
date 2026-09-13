const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // text is optional if an image is provided
    text: {
        type: String,
        default: "",
    },
    // Optional image attachment (Cloudinary URL)
    image: {
        type: String,
        default: null,
    },
    read: {
        type: Boolean,
        default: false,
    },
    // Soft delete — message content is replaced but document kept for chat history integrity
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // Flag set when a user edits a message
    isEdited: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;