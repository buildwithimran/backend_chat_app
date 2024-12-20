require('dotenv').config();
var jwt = require("jsonwebtoken");

function jwtToId(authHeader) {
    try {
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.SECRET);
            return decoded.userId;
        }
        return null;
    } catch (error) {
        console.error("Error sending Message:", error);
        return { status: "failed", error: error.message };
    }
}

module.exports = { jwtToId };
