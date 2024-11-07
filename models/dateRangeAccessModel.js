const mongoose = require('mongoose');

const DateRangeAccessSettingSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

module.exports = mongoose.model('DateRangeAccessSetting', DateRangeAccessSettingSchema);