const express = require("express");
const connectEnsureLogin = require('connect-ensure-login');
const router = express.Router();
const plantationController = require('../../controllers/plantationController');

// Render the page
router.get("/", plantationController.renderPage);


module.exports = router;
