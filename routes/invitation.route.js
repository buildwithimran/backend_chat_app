var express = require("express");
var router = express.Router();
const Friendship = require('../models/friendShip.model');
const Invitation = require('../models/invitation.model');
const User = require('../models/user.model');
const { sendNotification } = require("../helper/notifications");
const { jwtToId } = require("../helper/decodeJwtToken");
require('dotenv').config();


// Create Invitations
router.post("/create", async (req, res, next) => {
    try {
        var body = req.body;
        loggedInUserId = jwtToId(req.headers["authorization"]);
        var formObj = {
            senderUserId: loggedInUserId,
            receiverUserId: body.to
        }
        var crInv = await Invitation.create(formObj);
        return res.json({
            status: "success",
            message: "Invitation sent successfully",
            data: crInv,
        });
    } catch (error) {
        // Handle any potential errors
        console.error("Error during login:", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred during login.",
        });
    }
});

// My Invitations
router.get("/myInvitation", async (req, res, next) => {
    try {
        loggedInUserId = jwtToId(req.headers['authorization']);

        var myInv = await Invitation.find(
            {
                receiverUserId: loggedInUserId,
                deletedAt: null, isAccepted: false
            }
        )
            .populate('senderUserId',
                { fullName: 1, avatar: 1, countryCode: 1, phone: 1 }
            );
        return res.json({
            status: "success",
            data: myInv,
        });
    } catch (error) {
        // Handle any potential errors
        console.error("Error during login:", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred during login.",
        });
    }
});

// Accept Invitation
router.post('/accepted', async (req, res) => {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        const { invitationId } = req.body;
        var inviObj = await Invitation.findByIdAndUpdate(invitationId, { isAccepted: true });

        // Find or create Friendship entry for logged-in user
        var loggedInUserFriendship = await Friendship.findOne({ user: loggedInUserId });
        if (!loggedInUserFriendship) {
            loggedInUserFriendship = await Friendship.create({
                user: loggedInUserId,
                friends: [inviObj.senderUserId],
            });
        } else {
            loggedInUserFriendship.friends.push(inviObj.senderUserId);
            await loggedInUserFriendship.save();
        }

        // Similarly, update sender's Friendship entry
        var senderFriendship = await Friendship.findOne({ user: inviObj.senderUserId });
        if (!senderFriendship) {
            senderFriendship = await Friendship.create({
                user: inviObj.senderUserId,
                friends: [loggedInUserId],
            });
        } else {
            senderFriendship.friends.push(loggedInUserId);
            await senderFriendship.save();
        }

        var senderUser = await User.findById(inviObj.senderUserId);
        var acceptedUser = await User.findById(inviObj.receiverUserId);

        var notificationObj = {
            userId: inviObj.senderUserId,
            to: senderUser.fcmToken,
            notification: {
                title: `${acceptedUser.fullName} accepted your invitation to connect`,
                body: "",
                image: acceptedUser.avatar,
                priority: "HIGH",
                AnotherActivity: "True"
            },
            data: { data: {} }
        }
        await sendNotification(notificationObj);

        return res.json({
            status: 'success',
            message: 'Invitation accepted successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'Oops! There was an error during invitation accepting.',
        });
    }
});

module.exports = router;