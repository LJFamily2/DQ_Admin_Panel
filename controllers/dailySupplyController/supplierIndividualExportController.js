const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const { slug, supplierSlug } = req.params;
    const { startDate, endDate } = req.query;

    const area = await DailySupply.findOne({ slug })
   .populate('suppliers').populate({
    path: 'data',
    populate: {
      path: 'debt'
    }
   })
  


    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Find the specific supplier based on the supplierSlug
    const supplierData = area.suppliers.find(
      s => s.supplierSlug === supplierSlug,
    );

    if (!supplierData) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Filter data for the specific supplier
    const supplierSpecificData = area.data.filter(
      item => item.supplier._id.toString() === supplierData._id.toString(),
    );

    console.log(area)


    const test = await Supplier.findOne({supplierSlug: supplierSlug})
    .populate('debtHistory.debtRecord')

    console.log(test
    )
    res.render('src/dailySupplyIndividualExportPage', {
      layout: './layouts/defaultLayout',
      title: `Xuất dữ liệu mủ của ${supplierData.name}`,
      supplierData,
      supplierSpecificData,
      area,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}
