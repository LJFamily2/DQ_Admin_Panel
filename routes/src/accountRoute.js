const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("src/accountPage" , {layout:"./layouts/defaultLayout"})
})

module.exports = router;