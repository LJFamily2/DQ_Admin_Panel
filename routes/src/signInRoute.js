const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const signInController = require('../../controllers/signInController')

router.get("/", connectEnsureLogin.ensureLoggedOut({redirectTo: '/ho-so'}), signInController.renderLogin)
router.post('/login',connectEnsureLogin.ensureLoggedOut({redirectTo: '/ho-so'}), signInController.handleLogin)

module.exports = router;