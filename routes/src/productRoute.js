const express = require("express");
const router = express.Router();
const productController = require('../../controllers/productController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get("/" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.renderPage);
router.post("/addProduct" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.createProduct);
router.post("/getProducts" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.getProducts);
router.post("/update/:id" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.updateProduct);
router.post("/delete/:id" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.deleteProduct);
router.post("/deleteAll" , authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), productController.deleteAll);

module.exports = router;