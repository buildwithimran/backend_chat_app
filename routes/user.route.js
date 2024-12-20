var express = require("express");
var fs = require("fs");
var jwt = require("jsonwebtoken");
var passwordHash = require("password-hash");
var router = express.Router();
const twilio = require('twilio');
require('dotenv').config();
const { sendEmailAfterSignup, sendOtpEmail } = require("../helper/mailer");

const Conversation = require('../models/conversation.model');
const FavoriteUser = require('../models/favouriteUsers.model');
const FriendShip = require('../models/friendShip.model');
const Invitation = require('../models/invitation.model');
const Message = require('../models/messages.model');
const User = require('../models/user.model');

const { configureDefaultUserSettings } = require("../helper/configureDefaultSettings");
const { jwtToId } = require("../helper/decodeJwtToken");
var https = require('follow-redirects').https;



// App Login
router.post("/login", async (req, res, next) => {
    try {
        if (req.body.type === "phone") {
            const findUser = await User.findOne({
                countryCode: '+92',
                phone: req.body.phone,
            });

            if (!findUser) {
                return res.json({
                    status: "failed",
                    data: null,
                });
            }

            if (passwordHash.verify(req.body.password, findUser.password)) {
                const payload = { userId: findUser._id, email: findUser.email };
                const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' }); // Add expiry for better security

                if (req.body.fcm) {
                    await User.updateOne({ _id: findUser._id }, { fcm: req.body.fcm });
                }

                return res.json({
                    status: "success",
                    data: { user: findUser, token },
                });
            } else {
                return res.json({
                    status: "failed",
                    data: null,
                });
            }
        }

        if (req.body.type === "email") {
            const findUser = await User.findOne({
                email: req.body.email,
            });

            if (!findUser) {
                return res.json({
                    status: "failed",
                    data: null,
                });
            }

            if (passwordHash.verify(req.body.password, findUser.password)) {
                const payload = { userId: findUser._id, email: findUser.email };
                const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' }); // Add expiry for better security

                if (req.body.fcm) {
                    await User.updateOne({ _id: findUser._id }, { fcm: req.body.fcm });
                }

                return res.json({
                    status: "success",
                    data: { user: findUser, token },
                });
            } else {
                return res.json({
                    status: "failed",
                    data: null,
                });
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred during login.",
        });
    }
});
/* App Signup */
router.post("/register", async (req, res, next) => {
    try {
        const { fullName, email, phone, countryCode, password, role, fcm } = req.body;
        if (countryCode && countryCode.charAt(0) !== '+') {
            countryCode = '+' + countryCode;
        }
        const hashedPassword = passwordHash.generate(password);
        const countByPhone = await User.count({ where: { countryCode: countryCode, phone: phone } });
        if (countByPhone > 0) {
            return res.json({
                status: "user_mobile_already_exist",
                data: null,
            });
        }
        const countByEmail = await User.count({ where: { email: email } });
        if (countByEmail > 0) {
            return res.json({
                status: "user_email_already_exist",
                data: null,
            });
        }
        const userData = {
            fullName: fullName,
            email: email,
            phone: phone,
            role: role,
            fcmToken: fcm,
            password: hashedPassword,
        };
        const createUser = await User.create(userData);
        await configureDefaultUserSettings(createUser);
        const payload = { userId: createUser.id, email: createUser.email };
        const token = jwt.sign(payload, process.env.SECRET);
        await sendEmailAfterSignup(req.body.email);
        return res.json({
            status: "success",
            data: { user: createUser, token },
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred during signup.",
        });
    }
});

/* Reset Password */
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const hashedPassword = passwordHash.generate(password);

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.',
            });
        }

        await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

        res.json({
            status: 'success',
            message: 'Password Reset Successfully.',
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while resetting the password.',
        });
    }
});

/* Update profile */
router.post('/update-profile/:id', async function (req, res, next) {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (updatedUser) {
            res.json({
                status: 'success',
                message: 'Profile updated successfully.',
                data: updatedUser
            });
        } else {
            res.json({
                status: 'failed',
                message: 'Profile update failed.',
                data: null
            });
        }
    } catch (error) {
        console.error(error);
        res.json({
            status: 'error',
            message: 'An error occurred while updating the profile.',
            data: null
        });
    }
});

// My Friends
router.get('/fetch-friends', async function (req, res, next) {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        var fetchFriendShip = await FriendShip.find({ user: loggedInUserId }).select({ friends: 1 });
        const populatedFriendShips = await Promise.all(fetchFriendShip.map(async (friendShip) => {
            await FriendShip.populate(friendShip, { path: 'friends', model: 'user', select: { fullName: 1, avatar: 1, countryCode: 1, phone: 1, email: 1 } });
            return friendShip;
        }));

        if (populatedFriendShips.length > 0) {
            // Fetch latest message and favourite for each friend
            const friendsList = populatedFriendShips[0]['friends'];
            const latestMessages = [];

            for (const friend of friendsList) {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedInUserId, friend._id] }
                }).sort({ updatedAt: -1 });

                const checkFavUser = await FavoriteUser.findOne({ userId: loggedInUserId, likeUserId: friend._id })

                let latestMessage = null;
                if (conversation) {
                    latestMessage = await Message.findOne({
                        conversationId: conversation._id,
                        type: "text"
                    }).sort({ createdAt: -1 }).limit(1);
                }

                latestMessages.push({
                    friend,
                    latestMessage,
                    favourite: checkFavUser
                });
            }

            res.json({
                status: 'success',
                data: latestMessages
            });
        } else {
            res.json({
                status: 'success',
                data: null
            });
        }
    } catch (error) {
        console.error(error);
        res.json({
            status: 'error',
            message: 'An error occurred while fetching the user.',
            data: null
        });
    }
});

/* GetAll Users */
router.get('/participants', async function (req, res, next) {
    try {

        loggedInUserId = jwtToId(req.headers['authorization']);
        // Find invitations sent by the user
        const userInvitations = await Invitation.find({ senderUserId: loggedInUserId }, 'receiverUserId');
        const invitedUserIds = userInvitations.map(invitation => invitation.receiverUserId);

        // Find friendships for the user
        const fetchFriendShip = await FriendShip.findOne({ user: loggedInUserId }).select({ friends: 1 });

        let ids = [];

        if (fetchFriendShip) {
            // Extract friend IDs if friendships exist
            const friendIds = fetchFriendShip.friends.map(friend => friend.toString());
            ids = [...invitedUserIds, ...friendIds, loggedInUserId];
        } else {
            ids = [...invitedUserIds, loggedInUserId];
        }

        // Fetch users based on specific criteria
        const users = await User.find({
            // profileVisibility: true,
            _id: { $nin: ids }
        });

        // Return the fetched users as a response
        res.json({
            status: 'success',
            message: 'Users fetched successfully.',
            data: users,
        });
    } catch (error) {
        console.error(error);
        // Return an error message if an exception occurs
        res.json({
            status: 'error',
            message: 'An error occurred while fetching users by role.',
            data: null
        });
    }
});

// Favourite

router.post("/adToFavUser", async function (req, res, next) {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        var formObj = {
            userId: loggedInUserId,
            likeUserId: req.body.likeUserId
        };
        var checkAlreadyFav = await FavoriteUser.findOne(formObj);
        if (!checkAlreadyFav) {
            await FavoriteUser.create(formObj);
            res.json({
                status: "success"
            });
        }
    } catch (error) {
        res.json({
            status: "failed"
        });
    }
});

router.post("/removeToFavUser", async function (req, res, next) {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        await FavoriteUser.deleteOne({ userId: loggedInUserId, likeUserId: req.body.likeUserId, });
        res.json({
            status: "success"
        });
    } catch (error) {
        res.json({
            status: "failed"
        });
    }
});

router.post("/updateLastSceneTime", async function (req, res, next) {
    try {
        loggedInUserId = jwtToId(req.headers["authorization"]);
        await User.updateOne({ _id: loggedInUserId }, { lastScene: req.body.lastScene });
        res.json({
            status: "success"
        });
    } catch (error) {
        res.json({
            status: "failed"
        });
    }
});

router.post("/getChatUserLastSceneTime", async function (req, res, next) {
    try {
        var userLastScene = await User.findOne({ _id: req.body.receiverUserId }).select({ lastScene: 1 });
        res.json({
            status: "success",
            lastScene: userLastScene['lastScene']
        });
    } catch (error) {
        res.json({
            status: "failed"
        });
    }
});

// ========================================================
// ======================= Uploader =======================
// ========================================================

router.post('/uploader', function (req, res, next) {
    var realFile = Buffer.from(req.body.file, "base64");
    fs.writeFile("./uploads/" + req.body.name, realFile, function (err) {
        if (err) {
            res.json({
                status: 'failed',
                data: err
            });
        } else {
            res.json({
                status: 'success',
                data: req.body.name
            });
        }
    });
});

router.post('/sendTwillioPhoneOTP', async (request, response) => {
    try {
        // Create a Twilio client
        const client = new twilio(process.env.TWILLIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN);
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Define the phone number you want to send the SMS to (including the country code)
        const toPhoneNumber = request.body.phone;

        // Define your Twilio phone number (you can find this in your Twilio dashboard)
        const fromPhoneNumber = process.env.TWILLIO_VIRTUAL_PHONE; // Default Twilio phone number

        // Define the message you want to send
        const message = 'Your One-Time Password (OTP) is: ' + otp;

        // Send the SMS
        const sentMessage = await client.messages.create({
            body: message,
            from: fromPhoneNumber,
            to: toPhoneNumber,
        });

        // console.log(`SMS sent with SID: ${sentMessage.sid}`);

        response.json({
            status: 'success',
            data: {
                message: 'OTP sent successfully',
            },
        });
    } catch (error) {
        console.error('Error sending SMS:', error);

        response.status(500).json({
            status: 'failed',
            error: 'Error sending SMS',
        });
    }
});

/* Check user is already existancy */
router.post('/checkUserExist', async (req, res) => {
    try {
        const { phone, email } = req.body;
        const conditions = [];

        if (phone) {
            conditions.push({ phone: phone });
        }

        if (email) {
            conditions.push({ email: email });
        }
        const user = await User.findOne({
            $or: conditions
        });

        if (!user) {
            res.json({
                status: 'user_not_exist',
                message: 'Phone number or email does not exist in our records',
                data: null
            });
        } else {
            res.json({
                status: 'exist',
                message: 'Phone or email verified successfully',
                data: user
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while verifying the phone or email.',
        });
    }
});

// Send OTP By EMAIL
router.post('/sendEmailOTP', async (req, res, next) => {
    try {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);
        await sendOtpEmail(req.body.email, generatedOtp);
        res.json({
            status: 'success',
            data: generatedOtp,
        });
    } catch (error) {
        res.json({
            status: 'failed',
            data: null,
        });
    }
});

// Send OTP By SMS
router.post('/sendPhoneOTP', async (request, response, next) => {
    try {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);
        var options = {
            'method': 'POST',
            'hostname': process.env.SMS_BASE_URL,
            'path': '/sms/2/text/advanced',
            'headers': {
                'Authorization': 'App ' + process.env.SMS_AUTH_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            'maxRedirects': 20
        };

        var req = https.request(options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function (chunk) {
                console.error('========== Success');
                response.json({
                    status: 'success',
                    data: generatedOtp,
                });
            });
            res.on("error", function (error) {
                console.error('========== Error');
                console.error(error);
                response.json({
                    status: 'failed',
                    data: null,
                });
            });
        });

        var postData = JSON.stringify({
            "messages": [
                {
                    "destinations": [{ "to": request.body.phone }],
                    "from": "Social Group",
                    "text": "Your ChatApp OTP is: " + generatedOtp
                }
            ]
        });
        req.write(postData);
        req.end();
    } catch (error) {
        response.json({
            status: 'failed',
            data: null,
        });
    }
});

module.exports = router;