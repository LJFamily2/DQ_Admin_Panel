const DateRangeAccessSetting = require('../models/dateRangeAccessModel');
const  handleResponse  = require('../controllers/utils/handleResponse');

async function checkDateRange(req, res, next) {
  try {
    const dateRangeSetting = await DateRangeAccessSetting.findOne().sort({
      createdAt: -1,
    });

    if (!dateRangeSetting) {
     return handleResponse(
        req,
        res,
        403,
        'fail',
        'Lỗi truy cập vào giới hạn chỉnh sửa dữ liệu!',
        req.headers.referer,
      )
    }

    const currentDate = new Date();
    if (
      currentDate < dateRangeSetting.startDate ||
      currentDate > dateRangeSetting.endDate
    ) {
      return handleResponse(
        req,
        res,
        403,
        'fail',
        'Truy cập vào dữ liệu đã bị từ chối',
        req.headers.referer,
      )
    }

    next();
  } catch (error) {
    console.error('Error checking date range:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = checkDateRange;
