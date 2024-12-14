const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../../controllers/dailySupplyController");
const authMiddlewares = require("../../../middlewares/authMiddlewares");
const checkDateAccess = require("../../../middlewares/dateRangeAccessSetting");
const conditionalRateLimiter = require("../../../middlewares/limitedDeletionRequest");
const checkPermission = require("../../../middlewares/checkPermission");
const setUnreadCount = require("../../../middlewares/unreadCountMiddleware");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// User side for input data
router.get(
  "/nguyen-lieu",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng","Văn phòng"]),
  dailySupplyController.supplierInputController.renderInputDataDashboardPage
);
router.get(
  "/nguyen-lieu/:slug",
  setUnreadCount,
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng","Văn phòng"]),
  dailySupplyController.supplierInputController.renderInputDataPage
);
router.post(
  "/nguyen-lieu/getSupplierData/:slug",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng","Văn phòng"]),
  dailySupplyController.getSupplierDataController.getSupplierData
);
router.post(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng","Văn phòng"]),
  checkPermission("add"),
  dailySupplyController.supplierInputController.addData
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Văn phòng"]),
  checkDateAccess,
  checkPermission("update"),
  dailySupplyController.supplierInputController.updateSupplierData
);
router.delete(
  "/:id",
  conditionalRateLimiter,
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkDateAccess,
  checkPermission("delete"),
  dailySupplyController.supplierInputController.deleteSupplierData
);

module.exports = router;
