const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const profileController = require('../../controllers/profileController')

router.get("/",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), profileController.renderPage )

// router.post('/tao-tai-khoan', )

module.exports = router;