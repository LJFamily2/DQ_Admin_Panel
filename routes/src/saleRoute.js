const express = require("express");
const router = express.Router();
const saleController = require('../../controllers/saleController')

router.get('/', saleController.renderPage)
router.post('/createData', saleController.createData)
router.post('/getDatas', saleController.getDatas)

module.exports = router;