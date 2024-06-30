const AccountModel = require('../models/accountModel')
const handleResponse = require('./utils/handleResponse');

async function renderPage(req,res){
    res.render("src/profilePage" , {layout:"./layouts/defaultLayout", title: 'Hồ sơ cá nhân', user: req.user, messages: req.flash()})
}

module.exports = {
    renderPage,
}