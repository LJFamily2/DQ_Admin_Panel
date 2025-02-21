const express = require("express");
const router = express.Router();
const importExcelController = require("../../controllers/importExcelController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");
const multer = require("multer");

// Configure multer for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

// Apply common middlewares
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);
router.use(authMiddlewares.ensureRoles(["Admin", "Văn phòng", "superAdmin"]));

// Download template routes
router.get(
  "/:page",
  authMiddlewares.ensureLoggedIn,
  checkPermission("view"),
  importExcelController.downloadTemplate
);

// Import routes for different data types
router.post(
  "/sale",
  upload.single("excelFile"),
  checkPermission("add"),
  importExcelController.importSaleData
);

router.post(
  "/spend",
  upload.single("excelFile"),
  checkPermission("add"),
  importExcelController.importSpendData
);

router.post(
  "/rawMaterial",
  upload.single("excelFile"),
  checkPermission("add"),
  importExcelController.importRawMaterialData
);
router.post(
  "/product",
  upload.single("excelFile"),
  checkPermission("add"),
  importExcelController.importProductData
);

router.post(
  "/dailySupply",
  upload.single("excelFile"),
  checkPermission("add"),
  importExcelController.importDailySupplyInputData
);

module.exports = router;
