const handleResponse = require('../controllers/utils/handleResponse');
const dateRangeAccess = require('../models/dateRangeAccessModel');
const cron = require('node-cron');

async function setDateRange(req, res) {
  try {
    let { startDate, endDate } = req.body;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (!startDate) {
      startDate = today;
    }
    if (!endDate) {
      endDate = today.setUTCHours(23, 59, 59, 999);
    }

    const updateDateRange = await dateRangeAccess.findOneAndUpdate(
      {},
      {
        startDate,
        endDate,
      },
      { upsert: true, new: true },
    );

    if (!updateDateRange) {
      return handleResponse(
        req,
        res,
        500,
        'fail',
        'Nâng cấp ngày truy cập thất bại',
        req.headers.referer,
      );
    }
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Nâng cấp ngày truy cập thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error setting date range:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updateDateRangeAutomatically() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDate = today;
  const endDate = new Date(today);
  endDate.setUTCHours(23, 59, 59, 999);

  await dateRangeAccess.findOneAndUpdate(
    {},
    {
      startDate,
      endDate,
    },
    { upsert: true, new: true },
  );
}

// Schedule the job to run at the end of every day
cron.schedule('59 59 23 * * *', updateDateRangeAutomatically);

module.exports = {
  setDateRange,
  updateDateRangeAutomatically,
};