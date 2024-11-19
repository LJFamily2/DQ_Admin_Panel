const express = require("express");
const router = express.Router();
const rawMaterialController = require("../../controllers/rawMaterialController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const apicache = require("apicache");
const cache = apicache.middleware;

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.createData
);
router.post(
  "/getDatas",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.getDatas
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.updateData
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  rawMaterialController.deleteAll
);

module.exports = router;
