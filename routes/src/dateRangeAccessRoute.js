const express = require("express");
const router = express.Router();
const dateRangeController = require("../../controllers/dateRangeAccessController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

router.post(
  "/setDateRange",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin", "superAdmin"]),
  checkPermission("update"),
  dateRangeController.setDateRange
);

module.exports = router;
