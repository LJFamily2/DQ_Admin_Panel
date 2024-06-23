const express = require("express");
const router = express.Router();
const queryController = require("../../controllers/queryController")

router.get('/', queryController.renderPage )
router.post('/getQuery', queryController.getQuery)
router.post('/getDataTotal', queryController.getDataTotal)

module.exports = router;
