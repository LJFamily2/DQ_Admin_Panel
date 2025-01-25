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
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  spendController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("add"),
  spendController.createData
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  spendController.getData
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("update"),
  spendController.updateData
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  spendController.deleteData
);
router.post(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  spendController.deleteAll
);

module.exports = router;
