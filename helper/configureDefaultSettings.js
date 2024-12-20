const User = require('../models/user.model')
const Setting = require('../models/settings.model')

async function configureDefaultUserSettings(body) {
    try {
        var defaultSetting = { fontType: "small", wallpaper: "temp_2.jpg" };
        let updateSetting = await Setting.findOneAndUpdate(
            { userId: body['_id'] },
            { $set: defaultSetting },
            { new: true, upsert: true }
        );
        return updateSetting;
    } catch (error) {
        console.error("Error during create user defaut setting:", error);
        return { status: "failed", error: error.message };
    }
}

module.exports = { configureDefaultUserSettings };
