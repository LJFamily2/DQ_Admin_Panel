const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');

module.exports = {
  renderPage,
  createData,
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
      title: 'Quản lý hợp đồng bán mủ',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  try {
    console.log(req.body)
    // Extract product data
    const products = [];
    for (let i = 0; i < req.body.name.length; i++) {
      products.push({
        name: req.body.name[i],
        quantity: parseFloat(req.body.quantity[i].replace(/,/g, '')),
        price: parseFloat(req.body.price[i].replace(/,/g, '')),
      });
    }

    // Create new sale
    const newSale = await SaleModel.create({
      ...req.body,
      products: products,
      status: 'active',
    });

    if (!newSale) {
      return handleResponse(req, res, 404, 'fail', 'Thêm hợp đồng bán mủ thất bại', req.headers.referer);
    }
    handleResponse(req, res, 200, 'success', 'Thêm hợp đồng bán mủ thành công', req.headers.referer);
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

