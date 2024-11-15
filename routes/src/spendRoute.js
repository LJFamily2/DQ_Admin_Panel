const express = require("express");
const router = express.Router();
const spendController = require("../../controllers/spendController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.renderPage
);
router.post(
  "/addData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.createData
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.getData
);
router.post(
  "/update/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.updateData
);
router.post(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.deleteData
);
router.post(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.deleteAll
);

module.exports = router;
