const express = require("express");
const router = express.Router();
const Conversation = require('../models/conversation.model');
const Message = require('../models/messages.model')
const Notification = require('../models/notification.model')
require('dotenv').config();
var jwt = require("jsonwebtoken");
const { jwtToId } = require("../helper/decodeJwtToken");

router.post('/messageHistory', async (req, res) => {
    try {
        var body = req.body;
        loggedInUserId = jwtToId(req.headers["authorization"]);
        // Find or create a conversation between sender and receiver
        let conversation = await Conversation.findOne({
            participants: { $all: [loggedInUserId, body.receiverUserId] }
        });
        if (conversation) {
            var userMessagesHistory = await Message.find({
                conversationId: conversation._id
            }).select({ message: 1, type: 1, createdAt: 1 })
                .populate('receiverUserId', { avatar: 1 })
                .populate('senderUserId', { avatar: 1 });
            return res.json({
                status: 'success',
                data: userMessagesHistory
            });
        } else {
            return res.json({
                status: 'success',
                data: []
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'failed',
            error: 'An error occurred while fetching chat history.',
        });
    }
});

router.get('/getAllNotifications', async (req, res) => {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        let getNotifications = await Notification.find({
            userId: loggedInUserId
        });
        return res.json({
            status: 'success',
            data: getNotifications
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'failed',
            error: 'An error occurred while fetching notifications.',
        });
    }
});
module.exports = router;
