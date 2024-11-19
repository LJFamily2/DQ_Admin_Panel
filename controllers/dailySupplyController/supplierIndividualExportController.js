const { DailySupply } = require('../../models/dailySupplyModel');
const DateRangeAccess = require('../../models/dateRangeAccessModel');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const { slug, supplierSlug } = req.params;
    const { startDate, endDate } = req.query;

    const dateRangeAccess = await DateRangeAccess.findOne();
    // Find the area and populate only the requested supplier
    const area = await DailySupply.findOne({ slug })
      .populate({
        path: 'data',
        match: { slug: supplierSlug },
        populate: [ 'debt' ,  'moneyRetained' ],
      })
      .populate({
        path: 'suppliers',
        match: { supplierSlug },
        populate: ['moneyRetainedHistory', 'debtHistory'],
      });

    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Find the specific supplier based on the supplierSlug
    const supplierData = area.suppliers.find(
      (s) => s.supplierSlug === supplierSlug,
    );

    if (!supplierData) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Manually calculate totalDebtPaidAmount and totalMoneyRetainedAmount
    const totalDebtPaidAmount = supplierData.debtHistory.reduce(
      (total, debt) => total + debt.debtPaidAmount,
      0,
    );
    const totalMoneyRetainedAmount = supplierData.moneyRetainedHistory.reduce(
      (total, retained) => total + retained.retainedAmount,
      0,
    );

    // Calculate remainingDebt
    const remainingDebt = supplierData.initialDebtAmount - totalDebtPaidAmount;

    // Filter data for the specific supplier
    const supplierSpecificData = area.data.filter(
      (item) => item.supplier._id.toString() === supplierData._id.toString(),
    );
    
    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.render('src/dailySupplyIndividualExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${supplierData.name}`,
      supplierData,
      supplierSpecificData,
      area,
      user: req.user,
      startDate,
      dateRangeAccess,
      endDate,
      messages: req.flash(),
      totalDebtPaidAmount,
      totalMoneyRetainedAmount,
      remainingDebt,
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}
