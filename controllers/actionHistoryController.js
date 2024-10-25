const ActionHistory = require('../models/actionHistoryModel');
const Accounts = require('../models/accountModel');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const activities = await ActionHistory.find({}).populate({path: 'userId', select: 'username'});
    
    res.render('src/actionHistoryPage', {
      layout: './layouts/defaultLayout',
      title: 'Lịch sử hoạt động',
      activities,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}
