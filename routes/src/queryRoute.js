const express = require("express");
const router = express.Router();
const queryController = require("../../controllers/queryController")

router.get('/', queryController.renderPage )
router.post('/getQuery', queryController.getQuery)

module.exports = router;
