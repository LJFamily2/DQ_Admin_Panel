const AreaModel = require('../models/areaModel');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const PlantationModel = require('../models/plantationModel');
const RawMaterialModel = require('../models/rawMaterialModel');

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

    console.log(reqStartDate);
    console.log(reqEndDate);

    const filter = {};

    if (searchValue) {
      filter.$or = [
        { name: new RegExp(searchValue, 'i') },
        { code: new RegExp(searchValue, 'i') },
      ];
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    filter['data.date'] = {
      $gte: startDateObj,
      $lte: endDateObj,
    };

    const [totalRecords, plantations] = await Promise.all([
      PlantationModel.countDocuments(),
      PlantationModel.find()
        .populate('areaID')
        .sort({ [sortColumn]: sortDirection })
        .exec(),
    ]);

    const filteredPlantations = plantations.filter(plantation => {
      const hasDataInRange = plantation.data.some(dataItem => {
        const dataDate = new Date(dataItem.date);
        return dataDate >= startDateObj && dataDate <= endDateObj;
      });
      return hasDataInRange;
    });

    const data = filteredPlantations.map((plantation, index) => {
      let dryQuantityTotal = 0;
      let mixedQuantityTotal = 0;
      let notes = [];

      plantation.data.forEach(dataItem => {
        const dataDate = new Date(dataItem.date);
        if (dataDate >= startDateObj && dataDate <= endDateObj) {
          dryQuantityTotal +=
            (dataItem.products.dryQuantity * dataItem.products.dryPercentage) /
            100;
          mixedQuantityTotal += dataItem.products.mixedQuantity;
          if (dataItem.notes) notes.push(dataItem.notes);
        }
      });

      // Calculate dry and mixed totals based on frontend input prices
      const dryPriceValue =
        parseFloat(dryPrice.toString().replace(',', '.')) || 0;
      const mixedPriceValue =
        parseFloat(mixedPrice.toString().replace(',', '.')) || 0;
      const dryTotalValue = dryQuantityTotal * dryPriceValue;
      const mixedTotalValue = mixedQuantityTotal * mixedPriceValue;
      const totalMoneyValue = dryTotalValue + mixedTotalValue;

      return {
        no: parseInt(start, 10) + index + 1,
        area: plantation.areaID.name,
        plantation: plantation.code || plantation.name,
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

    const filteredRecords = filteredPlantations.length;

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

async function getDataTotal(req, res) {
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

    const today = new Date();
    const startDate = reqStartDate || today.toISOString().split('T')[0];
    const endDate = reqEndDate || today.toISOString().split('T')[0];

    console.log(reqStartDate);
    console.log(reqEndDate);

    const filter = {
      'date': { 
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    };

    if (searchValue) {
      filter.$or = [
        { name: new RegExp(searchValue, 'i') },
        { code: new RegExp(searchValue, 'i') },
      ];
    }

    const totalRecords = await DataModel.countDocuments(filter);
    const plantations = await DataModel.find(filter)
      .sort({ [sortColumn]: sortDirection })
      .skip(start)
      .limit(length)
      .exec();

    const data = plantations.map((plantation, index) => {
      let dryQuantityTotal = 0;
      let mixedQuantityTotal = 0;
      let notes = [];

      // Assuming each plantation is a single document, not an array
      const dataDate = new Date(plantation.date);
      if (dataDate >= new Date(startDate) && dataDate <= new Date(endDate)) {
        dryQuantityTotal +=
          (plantation.products.dryQuantity * plantation.products.dryPercentage) /
          100;
        mixedQuantityTotal += plantation.products.mixedQuantity;
        if (plantation.notes) notes.push(plantation.notes);
      }

      const dryPriceValue = parseFloat(dryPrice.toString().replace(',', '.')) || 0;
      const mixedPriceValue = parseFloat(mixedPrice.toString().replace(',', '.')) || 0;
      const dryTotalValue = dryQuantityTotal * dryPriceValue;
      const mixedTotalValue = mixedQuantityTotal * mixedPriceValue;
      const totalMoneyValue = dryTotalValue + mixedTotalValue;

      return {
        no: parseInt(start, 10) + index + 1,
        area: '', // Assuming areaID is not available in the provided schema
        plantation: plantation.code || '', // Assuming code or name fields are available
        dryQuantity: dryQuantityTotal, // Assuming formatNumberForDisplay is a function you have elsewhere
        dryPrice: dryPriceValue.toLocaleString('vi-VN'),
        dryTotal: dryTotalValue,
        mixedQuantity: mixedQuantityTotal,
        mixedPrice: mixedPriceValue.toLocaleString('vi-VN'),
        mixedTotal: mixedTotalValue,
        notes: notes.join(', '),
        totalMoney: totalMoneyValue,
        id: plantation._id, 
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: plantations.length, // Assuming this is the count after filtering
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
  getDataTotal,
};
