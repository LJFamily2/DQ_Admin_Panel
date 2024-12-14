const express = require("express");
const router = express.Router();
const spendController = require("../../controllers/spendController");
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
  spendController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("add"),
  spendController.createData
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin"]),
  spendController.getData
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("update"),
  spendController.updateData
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  spendController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  spendController.deleteAll
);

module.exports = router;
