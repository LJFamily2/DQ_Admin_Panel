const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Render the page
router.get(
  "/",

  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  dashboardController.renderPage
);
router.get(
  "/getRawMaterial",

  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  dashboardController.getRawMaterial
);
router.get(
  "/getProductData",

  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  dashboardController.getProductData
);
router.get(
  "/getRevenueAndSpending",

  authMiddlewares.ensureRoles(["Admin", "Quản lý", "Văn phòng"]),
  dashboardController.getRevenueAndSpending
);

module.exports = router;
