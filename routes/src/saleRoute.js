const express = require("express");
const router = express.Router();
const saleController = require("../../controllers/saleController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

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
  saleController.updateData
);
router.delete(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  saleController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  saleController.deleteAll
);

router.get("/hop-dong/:slug", saleController.renderDetailPage);

module.exports = router;
