const ActionHistory = require('../models/actionHistoryModel');

const handleResponse = require('../controllers/utils/handleResponse');

module.exports = {
  renderPage,
  deleteData,
  deleteAllData
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
      page = 1,
      limit = 10,
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

    // Calculate pagination parameters
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch activities with pagination
    const [activities, totalActivities] = await Promise.all([
      ActionHistory.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'userId',
          select: ['username', 'role'],
        }),
      ActionHistory.countDocuments(query),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalActivities / pageSize);

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
      currentPage: pageNumber,
      totalPages,
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteData(req, res) {
  try {
    const { id } = req.params;

    const deletedData = await ActionHistory.findByIdAndDelete(id);

    if (!deletedData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa dữ liệu thất bại',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa dữ liệu thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.log(error);
    return res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteAllData(req, res) {
  try {
    const deletedData = await ActionHistory.deleteMany();

    if (!deletedData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa tất cả dữ liệu thất bại',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa dữ tất cả liệu thành công',
      req.headers.referer,
    );
    
  } catch (error) {
    console.log(error);
    return res.status(500).render('partials/500', { layout: false });
  }
}