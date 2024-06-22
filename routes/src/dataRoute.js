const express = require("express");
const router = express.Router();
const dataController = require('../../controllers/dataController')

router.get('/',dataController.renderPage)
router.post('/createData', dataController.createData)
router.post('/getDatas', dataController.getDatas )
router.post('/update/:id', dataController.updateData )
router.post('/delete/:id', dataController.deleteData )
module.exports = router;