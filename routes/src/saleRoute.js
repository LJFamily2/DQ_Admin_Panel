const express = require("express");
const router = express.Router();
const saleController = require("../../controllers/saleController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",

  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  saleController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("add"),
  saleController.createData
);
router.post(
  "/getDatas",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  saleController.getDatas
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("update"),
  saleController.updateData
);
router.delete(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("delete"),
  saleController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  checkPermission("delete"),
  saleController.deleteAll
);

router.get("/hop-dong/:slug", saleController.renderDetailPage);

module.exports = router;
