const express = require("express");
const router = express.Router();
const saleController = require('../../controllers/saleController')
const connectEnsureLogin =  require('connect-ensure-login');

router.get('/',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.renderPage)
router.post('/createData',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.createData)
router.post('/getDatas',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.getDatas)
router.post('/update/:id',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.updateData )
router.post('/delete/:id',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.deleteData )
router.get('/hop-dong/:slug',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), saleController.renderDetailPage)

module.exports = router;