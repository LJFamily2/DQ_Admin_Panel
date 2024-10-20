const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');
const updatePricesAndRatiosHelper = require('../utils/updatePricesAndRatiosHelper');

module.exports = {
  renderPage,
  updatePricesAndRatios,
};
async function renderPage(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers')
      .populate('data.supplier');

    res.render('src/dailySupplyExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${area.name}`,
      area,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updatePricesAndRatios(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const {
      startDate,
      endDate,
      dryPrice,
      mixedPrice,
      kePrice,
      dongPrice,
      drySplit,
      mixedSplit,
      keSplit,
      dongSplit,
    } = req.body; 
    const { slug, supplierSlug } = req.params;

    const area = await DailySupply.findOne({ slug })
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
        req.headers.referer,
      );
    }

    const start = new Date(startDate || endDate || new Date());
    const end = new Date(endDate || startDate || new Date());
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const prices = {
      dryPrice: convertToDecimal(dryPrice),
      mixedPrice: convertToDecimal(mixedPrice),
      kePrice: convertToDecimal(kePrice),
      dongPrice: convertToDecimal(dongPrice),
    };

    const ratios = {
      'Mủ nước': convertToDecimal(drySplit),
      'Mủ tạp': convertToDecimal(mixedSplit),
      'Mủ ké': convertToDecimal(keSplit),
      'Mủ đông': convertToDecimal(dongSplit),
    };

    let supplierId = null;
    if (supplierSlug) {
      const supplier = await Supplier.findOne({ slug: supplierSlug });
      if (!supplier) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Không tìm thấy nhà cung cấp',
          req.headers.referer,
        );
      }
      supplierId = supplier._id;
    }

    // Update prices and ratios
    updatePricesAndRatiosHelper(
      area.data,
      start,
      end,
      prices,
      ratios,
      supplierId,
    );

    // Calculate and update debt and money retained for each data entry
    for (const entry of area.data) {
      let totalSupplierProfit = 0;
      let debtPaid = 0;
      let moneyRetained = 0;
    
      for (const material of entry.rawMaterial) {
        const { name, quantity, percentage, ratioSplit, price } = material;
    
        if (name === 'Mủ nước') {
           totalSupplierProfit +=
            quantity * (percentage / 100) * (ratioSplit / 100) * price;
           debtPaid +=
            quantity * (percentage / 100) * ((100 - ratioSplit) / 100) * price;
        } else {
           totalSupplierProfit += quantity * (ratioSplit / 100) * price;
           debtPaid += quantity * ((100 - ratioSplit) / 100) * price;
        }
      }
    
      moneyRetained = (totalSupplierProfit * entry.moneyRetained.percentage) / 100;
    
      // Ensure debt and moneyRetained are initialized
      if (!entry.debt) {
        entry.debt = { date: new Date(), debtPaidAmount: 0 };
      }
      if (!entry.moneyRetained) {
        entry.moneyRetained = { date: new Date(), retainedAmount: 0, percentage: 0 };
      }
    
      // Store old values
      const oldDebtPaidAmount = entry.debt.debtPaidAmount || 0;
      const oldMoneyRetainedAmount = entry.moneyRetained.retainedAmount || 0;

      // Calculate differences
      const debtPaidDifference = debtPaid - oldDebtPaidAmount;
      const moneyRetainedDifference = moneyRetained - oldMoneyRetainedAmount;

      // Update with new values
      entry.debt.debtPaidAmount += debtPaidDifference;
      entry.moneyRetained.retainedAmount += moneyRetainedDifference;
      
      // Save each entry sequentially
      await entry.save();
    }
    
    await area.save();

    const successMessage = supplierSlug
      ? 'Cập nhật giá thành công cho nhà cung cấp'
      : 'Cập nhật giá thành công cho khu vực';
    return handleResponse(
      req,
      res,
      200,
      'success',
      successMessage,
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}