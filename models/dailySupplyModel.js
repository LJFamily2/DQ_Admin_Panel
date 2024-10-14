const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const supplierSchema = new mongoose.Schema({
  name: String,
  code: String,
  supplierAddress: String,
  phone: String,
  identification: String,
  issueDate: String,
  manager: {
    type: Boolean,
    default: false,
  },
  ratioRubberSplit: {
    type: Number,
    default: 100,
  },
  ratioSumSplit: {
    type: Number,
    default: 100,
  },
  supplierSlug: {
    type: String,
    default: function() {
      return `${this.code}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
  },
  // Apply with the Contract Area
  purchasedPrice: {
    type: Number,
    default: 0
  },
  areaDeposit: {
    type: Number,
    default: 0
  },
  debt: {
    type: Number,
    default: function() {
      return this.purchasedAreaDimension * this.purchasedPrice - this.areaDeposit;
    }
  },
  purchasedAreaDimension: {
    type: Number,
    default: 0
  },
  areaDuration: {
    start: Date,
    end: Date
  }
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
          ratioSplit: Number,
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
  remainingAreaDimension: {
    type: Number,
    default: function() {
      return this.areaDimension; 
    }
  },
  contractDuration: {
    start: Date,
    end: Date
  },
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
