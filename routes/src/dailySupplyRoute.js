const express = require("express");
const router = express.Router();
const dailySupplyController = require('../../controllers/dailySupplyController')

// Render the page
router.get('/', dailySupplyController.renderPage)
router.get('/:slug', dailySupplyController.renderDetailPage)
router.post('/addArea', dailySupplyController.addArea)
router.post('/deleteArea/:id', dailySupplyController.deleteArea)
router.post('/getData', dailySupplyController.getData)
router.post('/update/:id', dailySupplyController.updateArea)
router.post('/addSupplier/:id', dailySupplyController.addSupplier)
router.post('/deleteSupplier/:id', dailySupplyController.deleteSupplier)
router.post('/updateSupplier/:id', dailySupplyController.editSupplier)

module.exports = router;
