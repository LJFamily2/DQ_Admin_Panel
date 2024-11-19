const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profileController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const apicache = require("apicache");
const cache = apicache.middleware;

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get("/", cache("5 minutes"), profileController.renderPage);

module.exports = router;
