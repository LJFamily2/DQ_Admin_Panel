const express = require("express");
const router = express.Router();
const dailySupplyController = require('../../controllers/dailySupplyController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// User side for input data
router.get('/nguyen-lieu', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Giám đốc']), dailySupplyController.supplierInputController.renderInputDataDashboardPage);
router.get('/nguyen-lieu/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Giám đốc']), dailySupplyController.supplierInputController.renderInputDataPage);
router.post('/nguyen-lieu/addData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Giám đốc']), dailySupplyController.supplierInputController.addData);
router.post('/nguyen-lieu/getSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Giám đốc']), dailySupplyController.getSupplierDataController.getSupplierData);
router.post('/nguyen-lieu/updateData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierInputController.updateSupplierData);
router.post('/nguyen-lieu/deleteData/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', "Giám đốc"]), dailySupplyController.supplierInputController.deleteSupplierData);

// Admin side
router.get('/', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierAreaController.renderPage);
router.post('/addArea', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierAreaController.addArea);
router.post('/deleteArea/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierAreaController.deleteArea);
router.post('/getData', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.getSupplierDataController.getData);

// Admin side for detail page
router.get('/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierController.renderDetailPage);
router.post('/update/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierController.updateArea);
router.post('/addSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Hàm lượng', 'Giám đốc']), dailySupplyController.supplierController.addSupplier);
router.post('/deleteSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierController.deleteSupplier);
router.post('/updateSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierController.editSupplier);
router.post('/getAreaSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.getSupplierDataController.getAreaSupplierData);
router.post('/rejectDeletionRequest/:id', authMiddlewares.ensureRoles(['Admin', 'Giám đốc', 'Giám đốc']), dailySupplyController.supplierController.rejectDeletionRequest);
router.post('/:slug/removeAllDeletionRequests', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), dailySupplyController.supplierController.
deleteAllRequests);

// Admin side for export
router.get("/:slug/xuat-file", authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierExportController.renderPage)
router.post("/:slug/xuat-file", authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.getSupplierDataController.getSupplierExportData)
router.post("/:slug/updatePrice/:supplierSlug?", authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierExportController.updatePricesAndRatios)

// Admin side for exporting individual
router.get("/:slug/xuat-file/:supplierSlug", authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.supplierIndividualExportController.renderPage)
router.post("/:slug/getSupplierExportData/:supplierSlug", authMiddlewares.ensureRoles(['Admin', 'Văn phòng', 'Giám đốc']), dailySupplyController.getSupplierDataController.getIndividualSupplierExportData)

module.exports = router;