const express = require("express");
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
router.post("/vuon/:slug/update/:id", plantationController.updateData)
router.post("/vuon/:slug/delete/:id", plantationController.deleteData)

module.exports = router;
