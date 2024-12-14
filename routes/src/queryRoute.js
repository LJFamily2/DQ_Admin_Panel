const express = require("express");
const router = express.Router();
const queryController = require("../../controllers/queryController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin"]),
  queryController.renderPage
);
// router.post('/getQuery', queryController.getQuery)
router.post(
  "/getDataTotal",
  authMiddlewares.ensureRoles(["Admin"]),
  queryController.getDataTotal
);

module.exports = router;
