const express = require("express");
const router = express.Router();
const dailySupplyController = require("../../../controllers/dailySupplyController");
const authMiddlewares = require("../../../middlewares/authMiddlewares");
const checkDateAccess = require("../../../middlewares/dateRangeAccessSetting");
const checkPermission = require("../../../middlewares/checkPermission");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Main page
router.get(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.supplierAreaController.renderPage
);
router.post(
  "/getData",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.getSupplierDataController.getData
);
router.post(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("add"),
  dailySupplyController.supplierAreaController.addArea
);
router.delete(
  "/deleteArea/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  dailySupplyController.supplierAreaController.deleteArea
);

// Detail page
router.get(
  "/:slug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.supplierController.renderDetailPage
);
router.put(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("update"),
  dailySupplyController.supplierController.updateArea
);
router.post(
  "/addSupplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng", "Hàm lượng"]),
  checkPermission("add"),
  dailySupplyController.supplierController.addSupplier
);
router.delete(
  "/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("delete"),
  dailySupplyController.supplierController.deleteSupplier
);
router.put(
  "/supplier/:id",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkPermission("update"),
  dailySupplyController.supplierController.editSupplier
);
router.post(
  "/getAreaSupplierData/:slug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.getSupplierDataController.getAreaSupplierData
);

// Admin side for export
router.get(
  "/:slug/xuat-file",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.supplierExportController.renderPage
);
router.post(
  "/:slug/xuat-file",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.getSupplierDataController.getSupplierExportData
);
router.put(
  "/:slug/updatePrice/:supplierSlug?",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  checkDateAccess,
  checkPermission("update"),
  dailySupplyController.supplierExportController.updatePricesAndRatios
);

// Admin side for exporting individual
router.get(
  "/:slug/xuat-file/:supplierSlug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.supplierIndividualExportController.renderPage
);
router.post(
  "/:slug/getSupplierExportData/:supplierSlug",
  authMiddlewares.ensureRoles(["Admin", "Văn phòng"]),
  dailySupplyController.getSupplierDataController
    .getIndividualSupplierExportData
);

module.exports = router;
