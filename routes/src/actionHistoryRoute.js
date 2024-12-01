const express = require("express");
const router = express.Router();
const authMiddlewares = require("../../middlewares/authMiddlewares");
const actionHistory = require("../../controllers/actionHistoryController");
const checkPermission = require("../../middlewares/checkPermission");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Activity history
router.get(
  "/nhat-ky-hoat-dong",

  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  actionHistory.renderPage
);
router.post(
  "/nhat-ky-hoat-dong/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("delete"),
  actionHistory.deleteData
);
router.delete(
  "/nhat-ky-hoat-dong/deleteAllData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("delete"),
  actionHistory.deleteAllData
);

module.exports = router;
