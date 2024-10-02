const AccountModel = require('../../models/accountModel');
const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const { slug, supplierSlug } = req.params;

    // Find the supplier by supplierSlug
    const supplier = await Supplier.findOne({ supplierSlug });
    if (!supplier) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Find the DailySupply document with the given slug
    const area = await DailySupply.findOne({ slug })
      .populate('accountID')
      .populate('suppliers');

    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Find the specific supplier's data in the suppliers array
    const supplierData = area.suppliers.find(s => s._id.equals(supplier._id));
    if (!supplierData) {
      return res.status(404).render('partials/404', { layout: false });
    }

    res.render('src/dailySupplyIndividualExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${supplierData.name}`,
      area,
      supplierData,
      user: req.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}