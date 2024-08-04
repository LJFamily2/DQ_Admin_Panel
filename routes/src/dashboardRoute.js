const express = require("express");
const router = express.Router();
const dashboardController = require('../../controllers/dashboardController')

// Render the page
router.get('/', dashboardController.renderPage)
router.get('/getRawMaterial', dashboardController.getRawMaterial)
router.get('/getProductData', dashboardController.getProductData)
router.get('/getRevenueAndSpending', dashboardController.getRevenueAndSpending)

module.exports = router;
