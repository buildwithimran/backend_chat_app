const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    fontType: {
        type: String,
        default: "medium",
    },
    wallpaper: {
        type: String,
        default: "defaultBg.png",
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
}, { timestamps: true })
module.exports = mongoose.model('setting', schema)