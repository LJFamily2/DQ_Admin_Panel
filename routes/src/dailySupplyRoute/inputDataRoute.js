const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../../controllers/dailySupplyController");
const authMiddlewares = require("../../../middlewares/authMiddlewares");
const checkDateAccess = require("../../../middlewares/dateRangeAccessSetting");
const conditionalRateLimiter = require("../../../middlewares/limitedDeletionRequest"); 

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// User side for input data
router.get(
  "/nguyen-lieu",

  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Quản lý"]),
  dailySupplyController.supplierInputController.renderInputDataDashboardPage
);
router.get(
  "/nguyen-lieu/:slug",

  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Quản lý"]),
  dailySupplyController.supplierInputController.renderInputDataPage
);
router.post(
  "/nguyen-lieu/getSupplierData/:slug",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Quản lý"]),
  dailySupplyController.getSupplierDataController.getSupplierData
);
router.post(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Quản lý"]),
  dailySupplyController.supplierInputController.addData
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Hàm lượng", "Văn phòng", "Quản lý"]),
  checkDateAccess,
  dailySupplyController.supplierInputController.updateSupplierData
);
router.delete(
  "/:id",
  conditionalRateLimiter,
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierInputController.deleteSupplierData
);

module.exports = router;
