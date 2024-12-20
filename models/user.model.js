const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    password: String,
    fcmToken: String, // Token used for FCM (Firebase Cloud Messaging)
    lastScene: {
        type: String,
        default: "",
    },
    countryISOCode: {
        type: String,
        default: "PK",
    },
    countryCode: {
        type: String,
        default: "+92",
    },
    avatar: {
        type: String,
        default: "avatar.png",
    },
    role: {
        type: String,
        default: "USER",
    },
    status: {
        type: String,
        default: "active",
    },
    profileVisibility: {
        type: Boolean,
        default: true,
    },
    deletedAt: { type: String, default: null },
}, { timestamps: true })
module.exports = mongoose.model('user', schema)