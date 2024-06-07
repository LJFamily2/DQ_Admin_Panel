const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const plantationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  areaID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Khu Vực",
  },
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Người Quản Lý",
  },
  code: {
    type: String,
    unique: true,
  },
  contactDurationStart: {
    type: Date,
  },
  contactDurationEnd: {
    type: Date,
  },
  plantationArea: {
    type: String,
  },
  data: [
    {
      date: {
        type: Date,
      },
      notes: {
        type: String,
      },
      products: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hàng hóa",
          },
          quantity: {
            type: Number,
          },
          percentage: {
            type: Number,
          },
          total: {
            type: Number,
          },
        },
      ],
    },
  ],
  slug: {
    type: String,
    slug: "name",
  },
});

plantationSchema.methods.calculateRemainingDays = function () {
  if (this.contactDurationEnd) {
    const endDate = new Date(this.contactDurationEnd);
    const today = new Date();

    let diffInTime = endDate.getTime() - today.getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    let years = Math.floor(diffInDays / 365);
    diffInDays -= years * 365;
    let months = Math.floor(diffInDays / 30);
    diffInDays -= months * 30;
    let days = Math.floor(diffInDays);

    let remainingDay = "";
    if (years > 0) {
      remainingDay += `${years} năm, `;
    }
    if (months > 0) {
      remainingDay += `${months} tháng, `;
    }
    if (days > 0) {
      remainingDay += `${days} ngày`;
    }

    return remainingDay.trim();
  } else {
    return "";
  }
};

const plantationModel = mongoose.model("Vườn", plantationSchema);

module.exports = plantationModel;
