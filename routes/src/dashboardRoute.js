const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");
const checkPermission = require("../../middlewares/checkPermission");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Render the page
router.get(
  "/",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.renderPage
);
router.get(
  "/getRawMaterial",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getRawMaterial
);
router.get(
  "/getProductData",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getProductData
);
router.get(
  "/getRevenueAndSpending",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getRevenueAndSpending
);

module.exports = router;
