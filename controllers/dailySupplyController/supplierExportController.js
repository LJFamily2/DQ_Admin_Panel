const AccountModel = require('../../models/accountModel');
const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');

module.exports = {
  renderPage,
  updatePrice
};
async function renderPage(req, res) {
  try {
    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers')
      .populate('data.supplier');

    res.render('src/dailySupplyExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${area.name}`,
      area,
      user: req.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updatePrice(req, res) {
  console.log(req.body)
  try {
    
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}