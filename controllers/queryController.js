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
      startDate,
      endDate,
    } = req.body;

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data || 'name';
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const filter = {};

    if (searchValue) {
      filter.$or = [
        { name: new RegExp(searchValue, 'i') },
        { code: new RegExp(searchValue, 'i') },
      ];
    }

    if (startDate && endDate) {
      filter['data.date'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const countQuery = PlantationModel.countDocuments(filter);
    const findQuery = PlantationModel.find(filter)
      .populate('areaID')
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const [totalRecords, filteredRecords, plantations] = await Promise.all([
      PlantationModel.countDocuments(),
      countQuery,
      findQuery,
    ]);

    console.log('Plantations found:', plantations); // Debugging

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

      return {
        no: parseInt(start, 10) + index + 1,
        area: plantation.areaID.name,
        plantation: plantation.name,
        dryQuantity: formatNumberForDisplay(dryQuantityTotal),
        dryPrice: '',
        dryTotal: '', // Future feature
        mixedQuantity: formatNumberForDisplay(mixedQuantityTotal),
        mixedPrice: '',
        mixedTotal: '', // Future feature
        notes: notes.join(', '),
        totalMoney: '',
        id: plantation._id,
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
