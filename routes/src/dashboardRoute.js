const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const apicache = require("apicache");
const cache = apicache.middleware;

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Render the page
router.get(
  "/",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.renderPage
);
router.get(
  "/getRawMaterial",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getRawMaterial
);
router.get(
  "/getProductData",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getProductData
);
router.get(
  "/getRevenueAndSpending",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dashboardController.getRevenueAndSpending
);

module.exports = router;
