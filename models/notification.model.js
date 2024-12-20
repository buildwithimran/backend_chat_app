const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    title: String,
    description: String,
    photo: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    deletedAt: { type: String, default: null },
}, { timestamps: true })
module.exports = mongoose.model('notification', schema)