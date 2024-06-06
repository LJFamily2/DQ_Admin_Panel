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
    type: String,
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

const plantationModel = mongoose.model("Vườn", plantationSchema);

module.exports = plantationModel;
