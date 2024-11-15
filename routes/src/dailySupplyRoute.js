const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../controllers/dailySupplyController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkDateAccess = require("../../middlewares/dateRangeAccessSetting");

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
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierInputController.deleteSupplierData
);

// Admin side for detail page
router.get(
  "/:slug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierController.renderDetailPage
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierController.updateArea
);
router.post(
  "/addSupplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Hàm lượng", "Quản lý"]),
  dailySupplyController.supplierController.addSupplier
);
router.delete(
  "/deleteSupplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierController.deleteSupplier
);
router.put(
  "/updateSupplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierController.editSupplier
);
router.post(
  "/getAreaSupplierData/:slug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.getSupplierDataController.getAreaSupplierData
);
router.post(
  "/rejectDeletionRequest/:id",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dailySupplyController.supplierController.rejectDeletionRequest
);
router.delete(
  "/:slug/removeAllDeletionRequests",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  dailySupplyController.supplierController.deleteAllRequests
);

// Admin side for export
router.get(
  "/:slug/xuat-file",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierExportController.renderPage
);
router.post(
  "/:slug/xuat-file",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.getSupplierDataController.getSupplierExportData
);
router.put(
  "/:slug/updatePrice/:supplierSlug?",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  checkDateAccess,
  dailySupplyController.supplierExportController.updatePricesAndRatios
);

// Admin side for exporting individual
router.get(
  "/:slug/xuat-file/:supplierSlug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierIndividualExportController.renderPage
);
router.post(
  "/:slug/getSupplierExportData/:supplierSlug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.getSupplierDataController
    .getIndividualSupplierExportData
);

module.exports = router;
