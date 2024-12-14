const ActionHistory = require("../models/actionHistoryModel");

async function setUnreadCount(req, res, next) {
  try {
    const unreadCount = await ActionHistory.countDocuments({ isRead: false });
    res.locals.unreadCount = unreadCount;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = setUnreadCount;