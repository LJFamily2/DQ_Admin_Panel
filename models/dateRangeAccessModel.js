const mongoose = require("mongoose");

const DateRangeAccessSettingSchema = new mongoose.Schema({
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true, default: Date.now },
});

const DateRangeAccess = mongoose.model(
  "DateRangeAccessSetting",
  DateRangeAccessSettingSchema
);

module.exports = DateRangeAccess;
2