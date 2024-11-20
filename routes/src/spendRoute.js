const express = require("express");
const router = express.Router();
const spendController = require("../../controllers/spendController");
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
  spendController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.createData
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.getData
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.updateData
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  spendController.deleteAll
);

module.exports = router;
