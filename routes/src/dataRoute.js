const express = require("express");
const router = express.Router();
const dataController = require('../../controllers/dataController')

router.get('/',dataController.renderPage)
router.post('/getData')
module.exports = router;
