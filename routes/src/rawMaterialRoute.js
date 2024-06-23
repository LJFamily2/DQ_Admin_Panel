const express = require("express");
const router = express.Router();
const rawMaterialController = require('../../controllers/rawMaterialController')

router.get('/',rawMaterialController.renderPage)
router.post('/createData', rawMaterialController.createData)
router.post('/getDatas', rawMaterialController.getDatas )
router.post('/update/:id', rawMaterialController.updateData )
router.post('/delete/:id', rawMaterialController.deleteData )
module.exports = router;