const express = require("express");
const router = express.Router();
const dailySupplyController = require('../../controllers/dailySupplyController')

// Render the page
router.get('/', dailySupplyController.renderPage)
router.get('/:slug', dailySupplyController.renderDetailPage)
router.post('/addData', dailySupplyController.addData)
router.post('/getData', dailySupplyController.getData)

module.exports = router;
