const mongoose = require("mongoose");

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
  contactDuration: {
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    }
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
});

plantationSchema.methods.getRemainingDays = function() {
  // Check if endDate field is defined
  if (this.contactDuration && this.contactDuration.endDate) {
    const today = new Date();
    const endDate = new Date(this.contactDuration.endDate);
    const timeDiff = endDate - today;
    const remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return remainingDays;
  } else {
    return '';
  }
};

const plantationModel = mongoose.model("Vườn", plantationSchema);

module.exports = plantationModel;