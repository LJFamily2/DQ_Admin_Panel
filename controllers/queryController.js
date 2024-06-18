const AreaModel = require('../models/areaModel');

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
      const { draw, start = 0, length = 10, search, order, columns, startDate, endDate } = req.body;
      const searchValue = search?.value || '';
      const sortColumn = columns?.[order?.[0]?.column]?.data || 'area';
      const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;
  
      const filter = {};
  
      // Apply search filter if there is a search value
      if (searchValue) {
        filter['$or'] = [
          { 'name': new RegExp(searchValue, 'i') },
          { 'plantations.name': new RegExp(searchValue, 'i') },
        ];
      }
  
      // Apply date range filter if both startDate and endDate are provided
      if (startDate && endDate) {
        filter['plantations.data.date'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      const [totalRecords, filteredRecords, areas] = await Promise.all([
        AreaModel.countDocuments(),
        AreaModel.countDocuments(filter),
        AreaModel.find(filter)
          .populate({
            path: 'plantations',
            populate: {
              path: 'data',
              match: {
                date: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
              },
            },
          })
          .sort({ [sortColumn]: sortDirection })
          .skip(parseInt(start, 10))
          .limit(parseInt(length, 10))
          .exec(),
      ]);
  
      const data = areas.map((area, index) => {
        let dryQuantityTotal = 0;
        let mixedQuantityTotal = 0;
        let notes = [];
  
        area.plantations.forEach(plantation => {
          plantation.data.forEach(dataItem => {
            dryQuantityTotal += dataItem.products.dryQuantity;
            mixedQuantityTotal += dataItem.products.mixedQuantity;
            if (dataItem.notes) notes.push(dataItem.notes);
          });
        });
  
        return {
          no: parseInt(start, 10) + index + 1,
          area: area.name,
          plantation: area.plantations.map(p => p.name).join(', '),
          dryQuantity: dryQuantityTotal,
          dryPrice: '',
          dryTotal: '', // Future feature
          mixedQuantity: mixedQuantityTotal,
          mixedPrice: '',
          mixedTotal: '', // Future feature
          notes: notes.join(', '),
          id: area._id,
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
