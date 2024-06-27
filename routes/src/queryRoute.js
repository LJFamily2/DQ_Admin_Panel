const express = require("express");
const router = express.Router();
const queryController = require("../../controllers/queryController")
const connectEnsureLogin =  require('connect-ensure-login');

router.get('/', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), queryController.renderPage )
// router.post('/getQuery',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), queryController.getQuery)
router.post('/getDataTotal',connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), queryController.getDataTotal)

module.exports = router;
