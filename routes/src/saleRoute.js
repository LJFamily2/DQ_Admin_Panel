const express = require("express");
const router = express.Router();
const saleController = require("../../controllers/saleController");
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
  saleController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("add"),
  saleController.createData
);
router.post(
  "/getDatas",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  saleController.getDatas
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("update"),
  saleController.updateData
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  saleController.deleteData
);
router.post(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  saleController.deleteAll
);

router.get("/hop-dong/:slug",setUnreadCount, checkPermission('view'), saleController.renderDetailPage);

module.exports = router;
