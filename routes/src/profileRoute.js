const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profileController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get("/",setUnreadCount, profileController.renderPage);

module.exports = router;
