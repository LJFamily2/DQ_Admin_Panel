const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const areaController = require('../../controllers/areaController')

router.get("/", areaController.renderPage )
router.post("/addArea", areaController.createArea )
router.post("/getAreas", areaController.getAreas )
router.post("/getArea/:id", areaController.getArea )
router.post("/updateArea", areaController.updateArea )
router.post("/deleteAreas", areaController.deleteAreas )
router.post("/deleteAll", areaController.deleteAllAreas )
router.post("/removePlantaion", areaController.removePlantationFromArea)
module.exports = router;