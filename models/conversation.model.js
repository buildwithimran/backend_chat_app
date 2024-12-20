const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    deletedAt: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('conversation', schema);
