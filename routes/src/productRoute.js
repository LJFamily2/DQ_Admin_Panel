const express = require("express");
const router = express.Router();
const productController = require("../../controllers/productController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin"]),
  productController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("add"),
  productController.createProduct
);
router.post(
  "/getProducts",
  authMiddlewares.ensureRoles(["Admin"]),
  productController.getProducts
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("update"),
  productController.updateProduct
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  productController.deleteProduct
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  productController.deleteAll
);

module.exports = router;
