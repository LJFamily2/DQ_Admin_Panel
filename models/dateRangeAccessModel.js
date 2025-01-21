const mongoose = require("mongoose");

const DateRangeAccessSettingSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    },
  },
  endDate: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setUTCHours(23, 59, 59, 999);
      return date;
    },
  },
});

const DateRangeAccess = mongoose.model(
  "DateRangeAccessSetting",
  DateRangeAccessSettingSchema
);

module.exports = DateRangeAccess;
