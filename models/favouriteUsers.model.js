const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    likeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    deletedAt: { type: String, default: null },
}, { timestamps: true })
module.exports = mongoose.model('favoriteUser', schema)