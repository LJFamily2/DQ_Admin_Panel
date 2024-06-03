const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const areaController = require('../../controllers/areaController')

router.get("/", areaController.renderPage )
router.post("/addProduct", areaController.createProduct )
router.post("/getProducts", areaController.getProducts )
router.post("/update/:id", areaController.updateProduct )
router.post("/delete/:id", areaController.deleteProduct )
router.post("/deleteAll", areaController.deleteAllProducts )

module.exports = router;