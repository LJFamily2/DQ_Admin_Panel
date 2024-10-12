const express = require('express');
const router = express.Router();
const AreaController = require('../../controllers/AreaController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);

// User side for input data
router.get(
  '/nguyen-lieu',
  authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']),
  AreaController.supplierInputController.renderInputDataDashboardPage,
);
router.get(
  '/nguyen-lieu/:slug',
  authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']),
  AreaController.supplierInputController.renderInputDataPage,
);
router.post(
  '/nguyen-lieu/addData/:id',
  authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']),
  AreaController.supplierInputController.addData,
);
router.post(
  '/nguyen-lieu/getSupplierData/:slug',
  authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']),
  AreaController.getSupplierDataController.getSupplierData,
);
router.post(
  '/nguyen-lieu/updateData/:id',
  authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Văn phòng']),
  AreaController.supplierInputController.updateSupplierData,
);
router.post(
  '/nguyen-lieu/deleteData/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierInputController.deleteSupplierData,
);

// Admin side
router.get(
  '/',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierAreaController.renderPage,
);
router.post(
  '/addArea',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierAreaController.addArea,
);
router.post(
  '/deleteArea/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierAreaController.deleteArea,
);
router.post(
  '/getData',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.getSupplierDataController.getData,
);

// Admin side for detail page
router.get(
  '/:slug',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierController.renderDetailPage,
);
router.post(
  '/update/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierController.updateArea,
);
router.post(
  '/addSupplier/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Hàm lượng']),
  AreaController.supplierController.addSupplier,
);
router.post(
  '/deleteSupplier/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierController.deleteSupplier,
);
router.post(
  '/updateSupplier/:id',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierController.editSupplier,
);
router.post(
  '/getAreaSupplierData/:slug',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.getSupplierDataController.getAreaSupplierData,
);

// Admin side for export
router.get(
  '/:slug/xuat-file',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierExportController.renderPage,
);
router.post(
  '/:slug/xuat-file',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.getSupplierDataController.getSupplierExportData,
);
router.post(
  '/:slug/updatePrice/:supplierSlug?',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierExportController.updatePrice,
);

// Admin side for exporting individual
router.get(
  '/:slug/xuat-file/:supplierSlug',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierIndividualExportController.renderPage,
);
router.post(
  '/:slug/getSupplierExportData/:supplierSlug',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.getSupplierDataController.getIndividualSupplierExportData,
);
router.post(
  '/:slug/updatePrice/:supplierSlug',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  AreaController.supplierIndividualExportController.updateSupplierPrice,
);

module.exports = router;
