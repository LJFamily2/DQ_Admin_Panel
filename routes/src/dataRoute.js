const express = require("express");
const router = express.Router();
const dataController = require('../../controllers/dataController')

router.get('/',dataController.renderPage)
router.post('/createData', dataController.createData)
module.exports = router;
