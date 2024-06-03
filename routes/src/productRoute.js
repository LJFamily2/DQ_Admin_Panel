const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const productController = require('../../controllers/productController')

router.get("/", productController.renderPage )
router.post("/addProduct", productController.createProduct )
router.post("/getProducts", productController.getProducts )
router.post("/update/:id", productController.updateProduct )
router.post("/delete/:id", productController.deleteProduct )
router.post("/deleteAll", productController.deleteAllProducts )

module.exports = router;