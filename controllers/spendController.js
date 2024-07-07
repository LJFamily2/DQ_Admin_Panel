const SpendModel = require('../models/spendModel');
const ProductTotalModel = require('../models/productTotalModel');
const formatTotalData = require('./utils/formatTotalData');
const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const convertToDecimal = require('./utils/convertToDecimal');

module.exports = {
  renderPage,
  createData,
};

async function renderPage(req, res) {
  try {
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);
    let spends = await SpendModel.find();
    res.render('src/spendPage', {
      layout: './layouts/defaultLayout',
      title: 'Quản lý chi tiêu',
      spends,
      total,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function createData(req, res) {
  try {
    // Corrected typo: req.bod to req.body
    req.body = trimStringFields(req.body);
    console.log(req.body);

    let quantity = convertToDecimal(req.body.quantity) || 0;
    let price = convertToDecimal(req.body.price) || 0;

    // Create spend document
    await SpendModel.create({
      ...req.body,
      quantity,
      price,
    });


    let totalPrice = price * quantity;

    // Update product total document
    await ProductTotalModel.findOneAndUpdate(
      {},
      {
        $inc: {
          spend: totalPrice,
          profit: totalPrice,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    // Success response
    return handleResponse(req, res, 201, 'success', 'Tạo chi tiêu thành công!', req.headers.referer);
  } catch (err) {
    console.log(err);
    // Error response
    res.status(500).render('partials/500', { layout: false });
  }
}
