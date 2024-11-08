const mongoose = require('mongoose');

const DateRangeAccessSettingSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const DateRangeAccess = mongoose.model('DateRangeAccessSetting', DateRangeAccessSettingSchema);

module.exports = DateRangeAccess;