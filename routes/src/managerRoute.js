const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("src/managerPage" , {
        layout:"./layouts/defaultLayout", 
        title: 'Quản lý người quản lý',
        messages: req.flash(),
    })
})

// router.post('/addManger', )


module.exports = router;