const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const areaController = require('../../controllers/areaController')

router.get("/", areaController.renderPage )
router.post("/addArea", areaController.createArea )
router.post("/getAreas", areaController.getAreas )
router.post("/getArea/:id", areaController.getArea )
router.post("/update/:id", areaController.updateArea )
router.post("/delete/:id", areaController.deleteArea )
router.post("/deleteAll", areaController.deleteAllAreas )

module.exports = router;