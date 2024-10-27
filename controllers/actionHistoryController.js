const ActionHistory = require('../models/actionHistoryModel');
const Accounts = require('../models/accountModel');

module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    const {
      startDate,
      endDate,
      selectedUser,
      createAction,
      updateAction,
      deleteAction,
    } = req.query;

    // Build the query object
    const query = {};
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) {
      if (!query.date) query.date = {};
      query.date.$lte = new Date(endDate);
    }
    if (selectedUser) query.userId = selectedUser;

    // Filter by action types
    const actionTypes = [];
    if (createAction) actionTypes.push('create');
    if (updateAction) actionTypes.push('update');
    if (deleteAction) actionTypes.push('delete');
    if (actionTypes.length > 0) query.actionType = { $in: actionTypes };

    const activities = await ActionHistory.find(query).populate({
      path: 'userId',
      select: ['username', 'role'],
    });

    // Extract unique users from activities
    const usersMap = new Map();
    activities.forEach(activity => {
      const user = activity.userId;
      if (user && !usersMap.has(user._id.toString())) {
        usersMap.set(user._id.toString(), user.username);
      }
    });
    const users = Array.from(usersMap, ([id, username]) => ({
      _id: id,
      username,
    }));

    res.render('src/actionHistoryPage', {
      layout: './layouts/defaultLayout',
      title: 'Lịch sử hoạt động',
      activities,
      user: req.user,
      users,
      messages: req.flash(),
      startDate,
      endDate,
      selectedUser,
      createAction,
      updateAction,
      deleteAction,
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}