const express = require("express");
const router = express.Router();
const { jwtToId } = require("../helper/decodeJwtToken");
const Setting = require('../models/settings.model');
const { configureDefaultUserSettings } = require("../helper/configureDefaultSettings");
require('dotenv').config();

router.post('/updateSetting', async (req, res) => {
    try {
        const body = req.body;
        const loggedInUserId = jwtToId(req.headers["authorization"]);

        // Find the setting for the logged-in user and update or create accordingly
        let updateSetting = await Setting.findOneAndUpdate(
            { userId: loggedInUserId },
            { $set: body },
            { new: true, upsert: true }
        );

        return res.json({
            status: 'success',
            data: updateSetting
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'failed',
            error: 'An error occurred while updating/creating the setting.',
        });
    }
});

router.get('/getSetting', async (req, res) => {
    try {
        const loggedInUserId = jwtToId(req.headers["authorization"]);
        let mySetting = await Setting.findOne({
            userId: loggedInUserId
        });
        if (!mySetting) {
            var appSetting = await configureDefaultUserSettings({ _id: loggedInUserId });
            return res.json({
                status: 'success',
                data: appSetting
            });
        } else {
            return res.json({
                status: 'success',
                data: mySetting
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

module.exports = router;
