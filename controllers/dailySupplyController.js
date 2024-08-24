
module.exports = {
    renderPage,
  };

async function renderPage(req, res) {
    try {
      let totalData = await ProductTotalModel.find();
      const total = formatTotalData(totalData);
      res.render('src/dashboard', {
        layout: './layouts/defaultLayout',
        title: 'Tổng dữ liệu',
        total,
        user: req.user,
      });
    } catch (err) {
      res.status(500).render('partials/500', { layout: false });
    }
  }