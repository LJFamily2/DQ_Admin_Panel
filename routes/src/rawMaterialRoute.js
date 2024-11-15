const express = require("express");
const router = express.Router();
const rawMaterialController = require("../../controllers/rawMaterialController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.renderPage
);
router.post(
  "/createData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.createData
);
router.post(
  "/getDatas",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.getDatas
);
router.post(
  "/update/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.updateData
);
router.post(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.deleteData
);
router.post(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.deleteAll
);

module.exports = router;
