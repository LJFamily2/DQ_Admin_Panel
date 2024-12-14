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

  authMiddlewares.ensureRoles(["Admin"]),
  saleController.renderPage
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("add"),
  saleController.createData
);
router.post(
  "/getDatas",
  authMiddlewares.ensureRoles(["Admin"]),
  saleController.getDatas
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("update"),
  saleController.updateData
);
router.delete(
  "/delete/:id",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  saleController.deleteData
);
router.delete(
  "/deleteAll",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("delete"),
  saleController.deleteAll
);

router.get("/hop-dong/:slug",setUnreadCount, saleController.renderDetailPage);

module.exports = router;
