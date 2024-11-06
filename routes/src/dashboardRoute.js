const express = require("express");
const router = express.Router();
const dashboardController = require('../../controllers/dashboardController')
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Render the page
router.get('/', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), dashboardController.renderPage)
router.get('/getRawMaterial', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), dashboardController.getRawMaterial)
router.get('/getProductData', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), dashboardController.getProductData)
router.get('/getRevenueAndSpending', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), dashboardController.getRevenueAndSpending)

module.exports = router;
