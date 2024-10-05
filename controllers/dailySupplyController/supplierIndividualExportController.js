const AccountModel = require('../../models/accountModel');
const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');

module.exports = {
  renderPage,
  updateSupplierPrice,
};

async function renderPage(req, res) {
  try {
    const { slug, supplierSlug } = req.params;
    const { startDate, endDate } = req.query;
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
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updateSupplierPrice(req, res) {
  console.log(req.body);
  console.log(req.params);
  
  try {
    const { startDate, endDate, dryPrice, mixedPrice, dongPrice } = req.body;
    const { slug, supplierSlug } = req.params;

    // Find the area by slug
    const area = await DailySupply.findOne({ slug: slug })
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

    // Set endDate to startDate if endDate is not provided, and vice versa
    const start = new Date(startDate || endDate);
    const end = new Date(endDate || startDate);

    // Convert prices to decimal
    const parsedDryPrice = convertToDecimal(dryPrice);
    const parsedMixedPrice = convertToDecimal(mixedPrice);
    const parsedDongPrice = convertToDecimal(dongPrice);

    // Find the supplier by slug in the database
    const supplier = await Supplier.findOne({ supplierSlug: supplierSlug });
    if (!supplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy nhà cung cấp',
        req.headers.referer
      );
    }

    // Iterate over the data and update prices within the date range for the specific supplier
    area.data.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= start && entryDate <= end && entry.supplier.equals(supplier._id)) {
        entry.rawMaterial.forEach(material => {
          if (material.name === 'Mủ nước' && parsedDryPrice > 0) {
            material.price = parsedDryPrice;
          } else if (material.name === 'Mủ tạp' && parsedMixedPrice > 0) {
            material.price = parsedMixedPrice;
          } else if ((material.name === 'Mủ ké' || material.name === 'Mủ đông') && parsedDongPrice > 0) {
            material.price = parsedDongPrice;
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
      'Cập nhật giá thành công cho nhà cung cấp',
      req.headers.referer
    );
  } catch (error) {
    console.error('Error updating supplier prices:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}