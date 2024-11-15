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
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.renderPage
);
router.get(
  "/getRawMaterial",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getRawMaterial
);
router.get(
  "/getProductData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getProductData
);
router.get(
  "/getRevenueAndSpending",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getRevenueAndSpending
);

module.exports = router;
