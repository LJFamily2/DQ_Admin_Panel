const AreaModel = require('../models/areaModel');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const PlantationModel = require('../models/plantationModel');

async function renderPage(req, res) {
  try {
    res.render('src/queryPage', {
      layout: './layouts/defaultLayout',
      title: 'Truy vấn',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}

async function getQuery(req, res) {
  try {
    const {
      draw,
      start = 0,
      length = 10,
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

    // Default to today's date if startDate and endDate are not provided
    const today = new Date();
    const startDate = reqStartDate || today.toISOString().split('T')[0];
    const endDate = reqEndDate || today.toISOString().split('T')[0];

    console.log(reqStartDate)
    console.log(reqEndDate)

    const filter = {};

    if (searchValue) {
      filter.$or = [
        { name: new RegExp(searchValue, 'i') },
        { code: new RegExp(searchValue, 'i') },
      ];
    }

    filter['data.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const [totalRecords, filteredRecords, plantations] = await Promise.all([
      PlantationModel.countDocuments(),
      PlantationModel.countDocuments(filter),
      PlantationModel.find(filter)
        .populate('areaID')
        .sort({ [sortColumn]: sortDirection })
        .skip(parseInt(start, 10))
        .limit(parseInt(length, 10))
        .exec(),
    ]);

    const data = plantations.map((plantation, index) => {
      let dryQuantityTotal = 0;
      let mixedQuantityTotal = 0;
      let notes = [];

      plantation.data.forEach(dataItem => {
        if (
          dataItem.date >= new Date(startDate) &&
          dataItem.date <= new Date(endDate)
        ) {
          dryQuantityTotal +=
            (dataItem.products.dryQuantity * dataItem.products.dryPercentage) /
            100;
          mixedQuantityTotal += dataItem.products.mixedQuantity;
          if (dataItem.notes) notes.push(dataItem.notes);
        }
      });

      // Calculate dry and mixed totals based on frontend input prices
      const dryPriceValue = parseFloat(dryPrice.toString().replace(',','.')) || 0;   
      const mixedPriceValue = parseFloat(mixedPrice.toString().replace(',','.')) || 0; 
      const dryTotalValue = dryQuantityTotal * dryPriceValue;
      const mixedTotalValue = mixedQuantityTotal * mixedPriceValue;
      const totalMoneyValue =  dryTotalValue + mixedTotalValue;
      return {
        no: parseInt(start, 10) + index + 1,
        area: plantation.areaID.name,
        plantation: plantation.name,
        dryQuantity: formatNumberForDisplay(dryQuantityTotal),
        dryPrice: Math.floor(dryPriceValue).toLocaleString('vi-VN'), 
        dryTotal: formatNumberForDisplay(dryTotalValue), 
        mixedQuantity: formatNumberForDisplay(mixedQuantityTotal),
        mixedPrice: Math.floor(mixedPriceValue).toLocaleString('vi-VN'),
        mixedTotal: formatNumberForDisplay(mixedTotalValue),
        notes: notes.join(', '),
        totalMoney: formatNumberForDisplay(totalMoneyValue), 
        slug: plantation.slug,
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


module.exports = {
  renderPage,
  getQuery,
};
