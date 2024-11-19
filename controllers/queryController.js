const RawMaterialModel = require('../models/rawMaterialModel');
const ProductTotalModel = require('../models/productTotalModel');
const formatTotalData = require('./utils/formatTotalData');
const convertToDecimal = require('./utils/convertToDecimal');

module.exports = {
  renderPage,
  // getQuery,
  getDataTotal,
};

async function renderPage(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.render('src/queryPage', {
      layout: './layouts/defaultLayout',
      total,
      user: req.user,
      startDate,
      endDate,
      title: 'Truy vấn',
    });
  } catch {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function getDataTotal(req, res) {
  try {
    const {
      draw,
      search,
      order,
      columns,
      startDate: reqStartDate,
      endDate: reqEndDate,
      dryPrice,
      mixedPrice,
    } = req.body;

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data || 'name';
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const filter = {};

    const today = new Date();
    today.setUTCHours(today.getUTCHours() + 7);

    const startDate = reqStartDate ? new Date(reqStartDate) : new Date(today);
    startDate.setUTCHours(startDate.getUTCHours() + 7);

    const endDate = reqEndDate ? new Date(reqEndDate) : new Date(startDate);
    endDate.setUTCHours(endDate.getUTCHours() + 7);

    // Apply the simplified date range filter
    filter.date = { $gte: startDate, $lte: endDate };

    if (searchValue) {
      filter.$or = [{ notes: new RegExp(searchValue, 'i') }];
    }

    const totalRecords = await RawMaterialModel.countDocuments(filter);
    const plantations = await RawMaterialModel.find(filter)
      .sort({ [sortColumn]: sortDirection })
      .exec();

    const data = plantations.map((plantation, index) => {
      let dryQuantityTotal = 0;
      let keQuantityTotal = 0;
      let mixedQuantityTotal = 0;

      const dataDate = new Date(plantation.date);
      if (dataDate >= new Date(startDate) && dataDate <= new Date(endDate)) {
        dryQuantityTotal +=
          (plantation.products.dryQuantity *
            plantation.products.dryPercentage) /
          100;
        keQuantityTotal +=
          (plantation.products.keQuantity * plantation.products.dryPercentage) /
          100;
        mixedQuantityTotal += plantation.products.mixedQuantity;
      }

      const dryPriceValue = convertToDecimal(dryPrice) || 0;
      const mixedPriceValue = convertToDecimal(mixedPrice) || 0;
      const dryTotalValue = dryQuantityTotal * dryPriceValue || 0;
      const kePriceValue = Math.max(convertToDecimal(dryPrice) - 4000, 0) || 0;
      const keTotalValue = keQuantityTotal * kePriceValue || 0;
      const mixedTotalValue = mixedQuantityTotal * mixedPriceValue || 0;
      const totalMoneyValue = dryTotalValue + mixedTotalValue + keTotalValue;

      return {
        no: index + 1,
        date: plantation.date.toLocaleDateString('vi-VN'),
        dryQuantity: dryQuantityTotal.toLocaleString('vi-VN'),
        dryPrice: dryPrice,
        dryTotal: dryTotalValue.toLocaleString('vi-VN'),
        mixedQuantity: mixedQuantityTotal.toLocaleString('vi-VN'),
        mixedPrice: mixedPrice,
        mixedTotal: mixedTotalValue.toLocaleString('vi-VN'),
        keQuantity: keQuantityTotal.toLocaleString('vi-VN'),
        kePrice: kePriceValue.toLocaleString('vi-VN'),
        keTotal: keTotalValue.toLocaleString('vi-VN'),
        notes: plantation.notes || '',
        totalMoney: totalMoneyValue.toLocaleString('vi-VN'),
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords, // Set recordsFiltered to totalRecords
      data,
    });
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}
