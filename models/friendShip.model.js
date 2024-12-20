const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    deletedAt: { type: String, default: null },
}, { timestamps: true })

module.exports = mongoose.model('friendship', schema)
