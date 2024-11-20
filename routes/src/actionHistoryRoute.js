const express = require("express");
const router = express.Router();
const authMiddlewares = require("../../middlewares/authMiddlewares");
const actionHistory = require("../../controllers/actionHistoryController");
const apicache = require('apicache');
const cache = apicache.middleware;

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Activity history
router.get(
  "/nhat-ky-hoat-dong",cache('5 minutes'),
  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  actionHistory.renderPage
);
router.post(
  "/nhat-ky-hoat-dong/deleteData/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  actionHistory.deleteData
);
router.post(
  "/nhat-ky-hoat-dong/deleteAllData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  actionHistory.deleteAllData
);

module.exports = router;
