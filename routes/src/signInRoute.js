const express = require("express");
const router = express.Router();
const signInController = require('../../controllers/signInController')
const authMiddlewares = require('../../middlewares/authMiddlewares');

router.get("/", authMiddlewares.ensureLoggedOut, signInController.renderLogin)
router.post('/login',authMiddlewares.ensureLoggedOut, signInController.handleLogin)

module.exports = router;