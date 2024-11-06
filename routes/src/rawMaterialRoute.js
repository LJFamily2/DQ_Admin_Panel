const express = require("express");
const router = express.Router();
const rawMaterialController = require('../../controllers/rawMaterialController')
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get('/',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), rawMaterialController.renderPage)
router.post('/createData',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),  rawMaterialController.createData)
router.post('/getDatas',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),  rawMaterialController.getDatas )
router.post('/update/:id',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),  rawMaterialController.updateData )
router.post('/delete/:id',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),  rawMaterialController.deleteData )
router.post('/deleteAll',  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),  rawMaterialController.deleteAll)

module.exports = router;