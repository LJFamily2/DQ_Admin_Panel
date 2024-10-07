const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');
const updatePrices = require('../utils/updatePrices');

module.exports = {
  renderPage,
  updateSupplierPrice,
};

async function renderPage(req, res) {
  try {
    const { slug, supplierSlug } = req.params;
    const { startDate, endDate } = req.query;

    const area = await DailySupply.findOne({ slug })
      .populate('accountID')
      .populate('suppliers');

    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    const supplierData = area.suppliers.find(s => s.supplierSlug === supplierSlug);
    if (!supplierData) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Filter data for the specific supplier
    const supplierSpecificData = area.data.filter(item => 
      item.supplier.toString() === supplierData._id.toString()
    );

    res.render('src/dailySupplyIndividualExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${supplierData.name}`,
      supplierData,
      supplierSpecificData,
      area,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updateSupplierPrice(req, res) {
  try {
    const { startDate, endDate, dryPrice, mixedPrice, kePrice, dongPrice } = req.body;
    const { slug, supplierSlug } = req.params;

    const area = await DailySupply.findOne({ slug: slug })
      .populate('accountID')
      .populate('suppliers')
      .populate('data.supplier');

    if (!area) {
      return handleResponse(req, res, 404, 'fail', 'Không tìm thấy khu vực cung cấp', req.headers.referer);
    }

    const supplier = await Supplier.findOne({ supplierSlug: supplierSlug });
    if (!supplier) {
      return handleResponse(req, res, 404, 'fail', 'Không tìm thấy nhà cung cấp', req.headers.referer);
    }

    const start = new Date(startDate || endDate || new Date().setHours(0, 0, 0, 0));
    const end = new Date(endDate || startDate || new Date().setHours(23, 59, 59, 999));

    const prices = {
      dryPrice: convertToDecimal(dryPrice),
      mixedPrice: convertToDecimal(mixedPrice),
      kePrice: convertToDecimal(kePrice),
      dongPrice: convertToDecimal(dongPrice)
    };

    updatePrices(area.data, start, end, prices, supplier._id);

    await area.save();

    return handleResponse(req, res, 200, 'success', 'Cập nhật giá thành công cho nhà cung cấp', req.headers.referer);
  } catch (error) {
    console.error('Error updating supplier prices:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}