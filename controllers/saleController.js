const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
      const sales = await SaleModel.find();
    const total = await ProductTotalModel.find();
    res.render('src/salePage', {
      layout: './layouts/defaultLayout',
      sales,
      total,
      messages: req.flash(),
      title: 'Quản lý hợp đồng',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}
