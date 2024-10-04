const AccountModel = require('../../models/accountModel');
const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');

module.exports = {
  renderPage,
  updatePrice,
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
  console.log(req.body);
  
  try {
    const { startDate, endDate, dryPrice, mixedPrice, kePrice } = req.body;
    // Find the area by slug
    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers')
      .populate('data.supplier');

    if (!area) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy khu vực cung cấp',
        req.headers.referer
      );
    }

    // Set date range
    let start, end;
    if (!startDate && !endDate) {
      // If no dates are selected, set to today's date
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else {
      // Set endDate to startDate if endDate is not provided, and vice versa
      start = new Date(startDate || endDate);
      end = new Date(endDate || startDate);
    }

    // Convert prices to decimal
    const parsedDryPrice = convertToDecimal(dryPrice);
    const parsedMixedPrice = convertToDecimal(mixedPrice);
    const parsedKePrice = convertToDecimal(kePrice);

    // Iterate over the data and update prices within the date range
    area.data.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= start && entryDate <= end) {
        entry.rawMaterial.forEach(material => {
          if (material.name === 'Mủ nước') {
            material.price = parsedDryPrice;
          } else if (material.name === 'Mủ tạp') {
            material.price = parsedMixedPrice;
          } else if ((material.name === 'Mủ ké' || material.name === 'Mủ đông')) {
            material.price = parsedKePrice;
          }
        });
      }
    });

    // Save the updated area
    await area.save();

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật giá thành công',
      req.headers.referer
    );
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}


