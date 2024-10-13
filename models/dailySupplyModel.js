const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const supplierSchema = new mongoose.Schema({
  name: String,
  code: String,
  address: String,
  phone: String,
  identification: String,
  manager: {
    type: Boolean,
    default: false,
  },
  ratioSplit: {
    type: Number,
    default: 0,
  },
  ratioMuNuocSplit: {
    type: Number,
    default: 0,
  },
  supplierSlug: {
    type: String,
    default: () =>
      `${this.code}-${Math.floor(100000 + Math.random() * 900000)}`,
  },
  // Apply with the Contract Area
  purchasePrice: {
    type: Number,
    default: 0
  },
  purchaseAreaDimension: {
    type: Number,
    default: 0
  },
});

const dailySupplySchema = new mongoose.Schema({
  accountID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accounts',
  },
  name: String,
  data: [
    {
      date: Date,
      rawMaterial: [
        {
          name: String,
          percentage: Number,
          quantity: Number,
          price: Number,
        },
      ],
      supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
      },
      note: String,
    },
  ],
  suppliers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
  ],
  limitData: Number,
  // Apply with the Contract Area
  areaDimension: Number,
  contractDurationStart: Date,
  contractDurationEnd: Date,
  areaPrice: Number,
  address: String,
  slug: {
    type: String,
    slug: 'name',
  },
});

const Supplier = mongoose.model('Supplier', supplierSchema);
const DailySupply = mongoose.model('DailySupply', dailySupplySchema);

module.exports = {
  Supplier,
  DailySupply,
};
