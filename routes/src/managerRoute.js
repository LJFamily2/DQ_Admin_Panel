const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const managerController = require('../../controllers/managerController')
const upload = require('../../middlewares/multer')

router.get("/", (req, res) => {
    res.render("src/managerPage" , {
        layout:"./layouts/defaultLayout", 
        title: 'Quản lý người quản lý',
        messages: req.flash(),
    })
})

router.post('/addManger', upload.fields([{ name: 'frontIdentification', maxCount: 1 },{ name: 'backIdentification', maxCount: 1 }]), managerController.createManager)


module.exports = router;