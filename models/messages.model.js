const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    message: String,
    type: { type: String, default: "text" },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "conversation" },
    deletedAt: { type: String, default: null },
}, { timestamps: true })
module.exports = mongoose.model('message', schema)