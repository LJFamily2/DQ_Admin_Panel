const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const signInController = require('../../controllers/signInController')

router.get("/", signInController.renderLogin)
router.post('/login', signInController.handleLogin)

module.exports = router;