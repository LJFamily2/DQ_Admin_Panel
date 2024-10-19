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
      const supplier = await Supplier.findOne({ supplierSlug });
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
    let totalDebtPaid = 0;
    let totalMoneyRetained = 0;
    
    for (const entry of area.data) {
      let totalSupplierProfit = 0;
      let debtPaid = 0;
      let moneyRetained = 0;
    
      for (const material of entry.rawMaterial) {
        const { name, quantity, percentage, ratioSplit, price } = material;
    
        // Store the old price
        const oldPrice = material.oldPrice || 0;
    
        if (name === 'Mủ nước') {
          const profitContribution =
            quantity * (percentage / 100) * (ratioSplit / 100) * price;
          const debtContribution =
            quantity * (percentage / 100) * ((100 - ratioSplit) / 100) * price;
          totalSupplierProfit += profitContribution;
          debtPaid += debtContribution;
        } else {
          const profitContribution = quantity * (ratioSplit / 100) * price;
          const debtContribution = quantity * ((100 - ratioSplit) / 100) * price;
          totalSupplierProfit += profitContribution;
          debtPaid += debtContribution;
        }
    
        // Calculate the difference between the old and new prices
        const priceDifference = price - oldPrice;
    
        // Adjust the debt amount based on the price difference
        entry.debt.amount += quantity * priceDifference;
      }
    
      moneyRetained = (totalSupplierProfit * entry.moneyRetained.percentage) / 100;
    
      // Ensure debt and moneyRetained are initialized
      if (!entry.debt) {
        entry.debt = {};
      }
      if (!entry.moneyRetained) {
        entry.moneyRetained = {};
      }
    
      // Store old values
      const oldDebtAmount = entry.debt.amount || 0;
      const oldDebtPaid = entry.debt.paid || 0;
      const oldMoneyRetained = entry.moneyRetained.amount || 0;

      // Update with new values
      entry.debt.amount = entry.supplier.debtAmount - debtPaid;
      entry.debt.paid = debtPaid;
      entry.moneyRetained.amount = moneyRetained;
    
      // Calculate differences
      const debtAmountDifference = entry.debt.amount - oldDebtAmount;
      const debtPaidDifference = entry.debt.paid - oldDebtPaid;
      const moneyRetainedDifference = entry.moneyRetained.amount - oldMoneyRetained;

      // Update totals
      totalDebtPaid += debtPaidDifference;
      totalMoneyRetained += moneyRetainedDifference;

      // Save each entry sequentially
      await entry.save();
    }
    
    // Update supplier data
    const supplierUpdates = area.suppliers.map(async supplierId => {
      const supplier = await Supplier.findById(supplierId);
      if (supplier) {
        supplier.debtAmount -= totalDebtPaid; // Deduct the total debt paid from the supplier's debt amount
        supplier.debtPaidAmount += totalDebtPaid;
        supplier.moneyRetainedAmount += totalMoneyRetained;
        return supplier.save();
      }
    });
    
    // Execute all supplier updates
    await Promise.all(supplierUpdates);

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