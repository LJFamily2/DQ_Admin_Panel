const express = require("express");
const router = express.Router();
const authMiddlewares = require("../../middlewares/authMiddlewares");
const actionHistory = require("../../controllers/actionHistoryController");
const checkPermission = require("../../middlewares/checkPermission");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Activity history
router.get(
  "/nhat-ky-hoat-dong",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  actionHistory.renderPage
);
router.post(
  "/nhat-ky-hoat-dong/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  actionHistory.deleteData
);
router.delete(
  "/nhat-ky-hoat-dong/deleteAllData",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  actionHistory.deleteAllData
);

module.exports = router;
