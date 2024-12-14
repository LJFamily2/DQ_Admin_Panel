const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Render the page
router.get(
  "/",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.renderPage
);
router.get(
  "/getRawMaterial",

  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getRawMaterial
);
router.get(
  "/getProductData",

  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getProductData
);
router.get(
  "/getRevenueAndSpending",

  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dashboardController.getRevenueAndSpending
);

module.exports = router;
