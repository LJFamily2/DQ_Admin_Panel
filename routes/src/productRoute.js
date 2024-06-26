const express = require("express");
const router = express.Router();
const productController = require('../../controllers/productController')
const connectEnsureLogin =  require('connect-ensure-login');

router.get("/",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.renderPage )
router.post("/addProduct",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.createProduct )
router.post("/getProducts",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.getProducts )
router.post("/update/:id",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.updateProduct )
router.post("/delete/:id",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.deleteProduct )
router.post("/deleteAll",connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), productController.deleteAllProducts )

module.exports = router;