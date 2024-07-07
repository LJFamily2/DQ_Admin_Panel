const SpendModel = require('../models/spendModel')
const ProductTotalModel = require('../models/productTotalModel')
const formatTotalData = require('./utils/formatTotalData');

module.exports = { 
    renderPage,
}

async function renderPage(req,res){
    try{
        let totalData = await ProductTotalModel.find();
        const total = formatTotalData(totalData);
        let spends = await SpendModel.find();
        res.render('src/spendPage',{
            layout: './layouts/defaultLayout',
            title: 'Quản lý chi tiêu',
            spends,
            total,
            user: req.user,
            messages: req.flash(),
        });
    }catch (err) {
        console.log(err)
        res.status(500).render('partials/500', {layout:false});
    }
}