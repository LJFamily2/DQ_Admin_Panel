const express = require("express");
const router = express.Router();
const saleController = require('../../controllers/saleController')
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);

router.get('/', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.renderPage)
router.post('/createData', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.createData)
router.post('/getDatas', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.getDatas)
router.post('/update/:id', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.updateData )
router.post('/delete/:id', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.deleteData )
router.post('/deleteAll', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']), saleController.deleteAll)

router.get('/hop-dong/:id', saleController.renderDetailPage)

module.exports = router;