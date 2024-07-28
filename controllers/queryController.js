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
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    res.render('src/queryPage', {
      layout: './layouts/defaultLayout',
      total,
      user: req.user,
      title: 'Truy vấn',
    });
  } catch {
    res.status(500).render('partials/500', {layout: false});
  }
}

// async function getQuery(req, res) {
//   try {
//     const {
//       draw,
//       start = 0,
//       length = 10,
//       search,
//       order,
//       columns,
//       startDate: reqStartDate,
//       endDate: reqEndDate,
//       dryPrice,
//       mixedPrice,
//     } = req.body;

//     const searchValue = search?.value || '';
//     const sortColumn = columns?.[order?.[0]?.column]?.data || 'name';
//     const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

//     // Default to today's date if startDate and endDate are not provided
//     const today = new Date();
//     const startDate = reqStartDate || today;
//     const endDate = reqEndDate || today;

//     const filter = {};

//     if (searchValue) {
//       filter.$or = [
//         { name: new RegExp(searchValue, 'i') },
//         { code: new RegExp(searchValue, 'i') },
//       ];
//     }

//     const startDateObj = new Date(startDate);
//     const endDateObj = new Date(endDate);

//     filter['data.date'] = {
//       $gte: startDateObj,
//       $lte: endDateObj,
//     };

//     const [totalRecords, plantations] = await Promise.all([
//       PlantationModel.countDocuments(),
//       PlantationModel.find()
//         .populate('areaID')
//         .sort({ [sortColumn]: sortDirection })
//         .exec(),
//     ]);

//     const filteredPlantations = plantations.filter(plantation => {
//       const hasDataInRange = plantation.data.some(dataItem => {
//         const dataDate = new Date(dataItem.date);
//         return dataDate >= startDateObj && dataDate <= endDateObj;
//       });
//       return hasDataInRange;
//     });

//     const data = filteredPlantations.map((plantation, index) => {
//       let dryQuantityTotal = 0;
//       let mixedQuantityTotal = 0;
//       let notes = [];

//       plantation.data.forEach(dataItem => {
//         const dataDate = new Date(dataItem.date);
//         if (dataDate >= startDateObj && dataDate <= endDateObj) {
//           dryQuantityTotal +=
//             (dataItem.products.dryQuantity * dataItem.products.dryPercentage) /
//             100;
//           mixedQuantityTotal += dataItem.products.mixedQuantity;
//           if (dataItem.notes) notes.push(dataItem.notes);
//         }
//       });

//       // Calculate dry and mixed totals based on frontend input prices
//       const dryPriceValue =
//         parseFloat(dryPrice.toString().replace(',', '.')) || 0;
//       const mixedPriceValue =
//         parseFloat(mixedPrice.toString().replace(',', '.')) || 0;
//       const dryTotalValue = dryQuantityTotal * dryPriceValue;
//       const mixedTotalValue = mixedQuantityTotal * mixedPriceValue;
//       const totalMoneyValue = dryTotalValue + mixedTotalValue;

//       return {
//         no: parseInt(start, 10) + index + 1,
//         area: plantation.areaID.name,
//         plantation: plantation.code || plantation.name,
//         dryQuantity: formatNumberForDisplay(dryQuantityTotal),
//         dryPrice: Math.floor(dryPriceValue).toLocaleString('vi-VN'),
//         dryTotal: formatNumberForDisplay(dryTotalValue),
//         mixedQuantity: formatNumberForDisplay(mixedQuantityTotal),
//         mixedPrice: Math.floor(mixedPriceValue).toLocaleString('vi-VN'),
//         mixedTotal: formatNumberForDisplay(mixedTotalValue),
//         notes: notes.join(', '),
//         totalMoney: formatNumberForDisplay(totalMoneyValue),
//         slug: plantation.slug,
//       };
//     });

//     const filteredRecords = filteredPlantations.length;

//     res.json({
//       draw,
//       recordsTotal: totalRecords,
//       recordsFiltered: filteredRecords,
//       data,
//     });
//   } catch  {
//     res.status(500).render('partials/500', {layout: false});
//   }
// }

async function getDataTotal(req, res) {
  try {
    const {
      draw,
      start = 0,
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

    // Initialize today's date and reset hours to start of the day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If reqStartDate is provided, use it; otherwise, use today
    const startDate = reqStartDate ? new Date(reqStartDate) : new Date(today);
    startDate.setHours(0, 0, 0, 0); // Ensure start of the day
    
    // If reqEndDate is provided, use it; otherwise, use startDate
    const endDate = reqEndDate ? new Date(reqEndDate) : new Date(startDate);
    endDate.setHours(23, 59, 59, 999); // Ensure end of the day
    
    // Apply the simplified date range filter
    filter.date = { $gte: startDate, $lte: endDate };

    if (searchValue) {
      filter.$or = [
        { notes: new RegExp(searchValue, 'i') },
      ];
    }

    const totalRecords = await RawMaterialModel.countDocuments(filter);
    const plantations = await RawMaterialModel.find(filter)
      .sort({ [sortColumn]: sortDirection })
      .skip(start)
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
          (plantation.products.keQuantity *
            plantation.products.dryPercentage) /
          100;
        mixedQuantityTotal += plantation.products.mixedQuantity;
      }

      const dryPriceValue = convertToDecimal(dryPrice) || 0;
      const mixedPriceValue = convertToDecimal(mixedPrice) || 0;
      const dryTotalValue = dryQuantityTotal * dryPriceValue || "";
      const kePriceValue = convertToDecimal(dryPrice) - 4000 || '';
      const keTotalValue = keQuantityTotal * kePriceValue || "";
      const mixedTotalValue = mixedQuantityTotal * mixedPriceValue || "";
      const totalMoneyValue = dryTotalValue + mixedTotalValue + keTotalValue;

      return {
        no: parseInt(start, 10) + index + 1,
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
        notes: plantation.notes || "",
        totalMoney: totalMoneyValue.toLocaleString('vi-VN'),
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: plantations.length,
      data,
    });
  } catch (err) {
    console.log(err)
    res.status(500).render('partials/500', {layout: false});
  }
}
