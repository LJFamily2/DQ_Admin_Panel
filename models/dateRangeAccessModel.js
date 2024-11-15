const mongoose = require("mongoose");

const DateRangeAccessSettingSchema = new mongoose.Schema({
  startDate: { type: Date, required: true, default: null },
  endDate: { type: Date, required: true, default: null },
});

const DateRangeAccess = mongoose.model(
  "DateRangeAccessSetting",
  DateRangeAccessSettingSchema
);

module.exports = DateRangeAccess;
2