const DataModel = require('../models/dataModel');
module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const datas = await DataModel.find({});
    res.render('src/managerPage', {
      layout: './layouts/defaultLayout',
      datas,
      messages: req.flash(),
      title: 'Dữ liệu',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
