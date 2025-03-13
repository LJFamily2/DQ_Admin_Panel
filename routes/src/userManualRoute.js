const express = require("express");
const router = express.Router();
const userManualController = require("../../controllers/userManualController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get("/", setUnreadCount, userManualController.renderPage);

module.exports = router;
