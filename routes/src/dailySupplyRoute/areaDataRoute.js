const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../../controllers/dailySupplyController");
const authMiddlewares = require("../../../middlewares/authMiddlewares");
const checkDateAccess = require("../../../middlewares/dateRangeAccessSetting");
const apicache = require("apicache");
const cache = apicache.middleware;

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Main page
router.get(
  "/",
  cache("5 minutes"),
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierAreaController.renderPage
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.getSupplierDataController.getData
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierAreaController.addArea
);
router.delete(
  "/deleteArea/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierAreaController.deleteArea
);

// Detail page
router.get(
  "/:slug",
  cache("5 minutes"),
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
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Quản lý"]),
  dailySupplyController.supplierController.deleteSupplier
);
router.put(
  "/supplier/:id",
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
  cache("5 minutes"),
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
  cache("5 minutes"),
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
