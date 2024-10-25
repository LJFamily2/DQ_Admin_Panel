const express = require("express");
const router = express.Router();
const dailySupplyController = require('../../controllers/dailySupplyController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);

// User side for input data
router.get('/nguyen-lieu', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.supplierInputController.renderInputDataDashboardPage);
router.get('/nguyen-lieu/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.supplierInputController.renderInputDataPage);
router.post('/nguyen-lieu/addData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.supplierInputController.addData);
router.post('/nguyen-lieu/getSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.getSupplierDataController.getSupplierData);
router.post('/nguyen-lieu/updateData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Văn phòng']), dailySupplyController.supplierInputController.updateSupplierData);
router.post('/nguyen-lieu/deleteData/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierInputController.deleteSupplierData);

// Admin side
router.get('/', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierAreaController.renderPage);
router.post('/addArea', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierAreaController.addArea);
router.post('/deleteArea/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierAreaController.deleteArea);
router.post('/getData', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getSupplierDataController.getData);

// Admin side for detail page
router.get('/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierController.renderDetailPage);
router.post('/update/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierController.updateArea);
router.post('/addSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Hàm lượng']), dailySupplyController.supplierController.addSupplier);
router.post('/deleteSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierController.deleteSupplier);
router.post('/updateSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierController.editSupplier);
router.post('/getAreaSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getSupplierDataController.getAreaSupplierData);

// Admin side for export
router.get("/:slug/xuat-file", authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierExportController.renderPage)
router.post("/:slug/xuat-file", authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getSupplierDataController.getSupplierExportData)
router.post("/:slug/updatePrice/:supplierSlug?", authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierExportController.updatePricesAndRatios)

// Admin side for exporting individual
router.get("/:slug/xuat-file/:supplierSlug", authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.supplierIndividualExportController.renderPage)
router.post("/:slug/getSupplierExportData/:supplierSlug", authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getSupplierDataController.getIndividualSupplierExportData)

module.exports = router;