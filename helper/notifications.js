const Conversation = require('../models/conversation.model');
const Message = require('../models/messages.model');
const Notification = require('../models/notification.model');

const axios = require('axios');
require('dotenv').config();

async function sendNotification(body) {
    try {
        if (body['to']) {
            const headers = {
                "Content-Type": "application/json",
                Authorization: "key=" + process.env.FIREBASE_SECRET,
            };
            const response = await axios.post("https://fcm.googleapis.com/fcm/send", body, { headers });

            if (response.status === 200) {
                var createNoti = await Notification.create({
                    title: body.notification.title,
                    description: body.notification.body,
                    photo: body.notification.image,
                    userId: body.userId,
                })
                return { status: "success", notification: createNoti };
            } else {
                console.log("Failed to send notification. Status:", response.status);
                return { status: "failed", error: response.data };
            }
        }
    } catch (error) {
        console.error("Error sending notification:", error);
        return { status: "failed", error: error.message };
    }
}

async function sendMessage(body) {
    try {
        const { message, senderUserId, receiverUserId, type } = body;
        // Find or create a conversation between sender and receiver
        let conversation = await Conversation.findOne({
            participants: { $all: [senderUserId, receiverUserId] }
        });
        // If the conversation doesn't exist, create a new one
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderUserId, receiverUserId]
            });
        }

        const chatData = {
            type: type,
            message: message.trim(),
            senderUserId: senderUserId,
            receiverUserId,
            conversationId: conversation._id
        };

        const createdMessage = await Message.create(chatData);

        const singleMessage = await Message.findOne({ _id: createdMessage._id })
            .populate('receiverUserId', 'fullName avatar countryCode phone')
            .populate('senderUserId', 'fullName avatar countryCode phone');

        return { status: 'success', data: singleMessage };
    } catch (error) {
        console.error("Error sending Message:", error);
        return { status: "failed", error: error.message };
    }
}

module.exports = { sendNotification, sendMessage };
