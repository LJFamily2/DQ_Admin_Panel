const express = require("express");
const router = express.Router();
const saleController = require('../../controllers/saleController')

router.get('/', saleController.renderPage)
router.post('/createData', saleController.createData)
router.post('/getDatas', saleController.getDatas)
router.post('/update/:id', saleController.updateData )
router.post('/delete/:id', saleController.deleteData )
router.get('/hop-dong/:slug', saleController.renderDetailPage)

module.exports = router;