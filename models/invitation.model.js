const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    isAccepted: {
        type: Boolean,
        default: false,
    },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    deletedAt: { type: String, default: null },
}, { timestamps: true })
module.exports = mongoose.model('invitation', schema)