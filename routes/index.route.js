var express = require("express");
var router = express.Router();

router.get("/", async function (req, res, next) {
    return res.json('Welcome to Backend of ChatApp');
});

module.exports = router;
