const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../../controllers/dailySupplyController");
const authMiddlewares = require("../../../middlewares/authMiddlewares");
const checkDateAccess = require("../../../middlewares/dateRangeAccessSetting");
const checkPermission = require("../../../middlewares/checkPermission");
const setUnreadCount = require("../../../middlewares/unreadCountMiddleware");
const checkPageAccess = require("../../../middlewares/checkPageAccess");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);
router.use(checkPageAccess());

// Main page
router.get(
  "/",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.supplierAreaController.renderPage
);
router.post(
  "/getData",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.getSupplierDataController.getData
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkPermission("add"),
  dailySupplyController.supplierAreaController.addArea
);
router.delete(
  "/deleteArea/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkPermission("delete"),
  dailySupplyController.supplierAreaController.deleteArea
);

// Detail page
router.get(
  "/:slug",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.supplierController.renderDetailPage
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkPermission("update"),
  dailySupplyController.supplierController.updateArea
);
router.post(
  "/addSupplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Hàm lượng", "superAdmin"]),
  checkPermission("add"),
  dailySupplyController.supplierController.addSupplier
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkPermission("delete"),
  dailySupplyController.supplierController.deleteSupplier
);
router.put(
  "/supplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkPermission("update"),
  dailySupplyController.supplierController.editSupplier
);
router.post(
  "/getAreaSupplierData/:slug",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.getSupplierDataController.getAreaSupplierData
);

// Admin side for export
router.get(
  "/:slug/xuat-file",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.supplierExportController.renderPage
);
router.post(
  "/:slug/xuat-file",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.getSupplierDataController.getSupplierExportData
);
router.put(
  "/:slug/updatePrice/:supplierSlug?",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  checkDateAccess,
  checkPermission("update"),
  dailySupplyController.supplierExportController.updatePricesAndRatios
);
// Export all supplier data
router.get(
  "/:slug/xuat-file/tat-ca",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.supplierExportController.renderAllData
);

// Admin side for exporting individual
router.get(
  "/:slug/xuat-file/:supplierSlug",
  setUnreadCount,
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.supplierIndividualExportController.renderPage
);
router.post(
  "/:slug/getSupplierExportData/:supplierSlug",
  checkPermission("view"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]),
  dailySupplyController.getSupplierDataController.getIndividualSupplierExportData
);

module.exports = router;
