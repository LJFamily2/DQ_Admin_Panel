const express = require("express");
const router = express.Router();
const productController = require("../../controllers/productController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",

  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.createProduct
);
router.post(
  "/getProducts",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.getProducts
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.updateProduct
);
router.delete(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.deleteProduct
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  productController.deleteAll
);

module.exports = router;
