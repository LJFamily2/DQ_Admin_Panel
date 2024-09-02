const express = require("express");
const router = express.Router();
const profileController = require('../../controllers/profileController')
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);

router.get("/", profileController.renderPage )


module.exports = router;