const express = require("express");
const router = express.Router();
const rawMaterialController = require('../../controllers/rawMaterialController')
const connectEnsureLogin =  require('connect-ensure-login');

router.get('/', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}),rawMaterialController.renderPage)
router.post('/createData', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), rawMaterialController.createData)
router.post('/getDatas', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), rawMaterialController.getDatas )
router.post('/update/:id', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), rawMaterialController.updateData )
router.post('/delete/:id', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), rawMaterialController.deleteData )
module.exports = router;