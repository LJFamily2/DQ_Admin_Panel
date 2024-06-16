const express = require("express");
const connectEnsureLogin = require('connect-ensure-login');
const router = express.Router();
const plantationController = require('../../controllers/plantationController');

// Render the page
router.get("/", plantationController.renderPage);
router.post('/addPlantation', plantationController.createPlantation)
router.post("/getPlantations", plantationController.getPlantations)
router.post("/update/:id", plantationController.updatePlantation)
router.post("/delete/:id", plantationController.deletePlantation)
router.post("/deleteAll", plantationController.deleteAllPlantation)

// Plantation detail
router.get("/vuon/:slug", plantationController.renderDetailPage)
router.post("/vuon/:slug/addData", plantationController.addData)
router.post("/:slug/getDatas", plantationController.getDatas)
router.post("/vuon/:slug/update/:id")
router.post("/vuon/:slug/delete/:id")

module.exports = router;
