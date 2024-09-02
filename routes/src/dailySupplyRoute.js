const express = require("express");
const router = express.Router();
const dailySupplyController = require('../../controllers/dailySupplyController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);

// User side for input data
router.get('/nguyen-lieu', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.renderInputDataDashboardPage);
router.get('/nguyen-lieu/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.renderInputDataPage);
router.post('/nguyen-lieu/addData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.addData);
router.post('/nguyen-lieu/getSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.getSupplierData);
router.post('/nguyen-lieu/updateData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng', 'Văn phòng']), dailySupplyController.updateSupplierData);
router.post('/nguyen-lieu/deleteData/:id', authMiddlewares.ensureRoles(['Admin', 'Hàm lượng']), dailySupplyController.deleteSupplierData);

// Admin side
router.get('/', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.renderPage);
router.post('/addArea', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.addArea);
router.post('/deleteArea/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.deleteArea);
router.post('/getData', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getData);

// Admin side for detail page
router.get('/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.renderDetailPage);
router.post('/update/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.updateArea);
router.post('/addSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.addSupplier);
router.post('/deleteSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.deleteSupplier);
router.post('/updateSupplier/:id', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.editSupplier);
router.post('/getAreaSupplierData/:slug', authMiddlewares.ensureRoles(['Admin', 'Văn phòng']), dailySupplyController.getAreaSupplierData);

module.exports = router;