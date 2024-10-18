const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

// Supplier Schema
const debtSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: {
    type: Number,
    default: function() {
      return this.purchasedAreaDimension * this.purchasedPrice - this.areaDeposit;
    },
  },
  paid: { type: Number, default: 0 },
});

const moneyRetainedSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  date: { type: Date, required: true },
});

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  supplierAddress: { type: String, required: true },
  phone: { type: String, required: true },
  identification: { type: String, required: true },
  issueDate: { type: Date, required: true },
  manager: { type: Boolean, default: false },
  ratioRubberSplit: { type: Number, default: 100 },
  ratioSumSplit: { type: Number, default: 100 },
  supplierSlug: {
    type: String,
    default: function() {
      return `${this.code}-${Math.floor(100000 + Math.random() * 900000)}`;
    },
  },
  purchasedPrice: { type: Number, default: 0 },
  areaDeposit: { type: Number, default: 0 },
  debt: [{type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply'}],
  moneyRetained: [{type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply'}],
  purchasedAreaDimension: { type: Number, default: 0 },
  areaDuration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
});

// dailySupply Schema
const rawMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  quantity: { type: Number, required: true },
  ratioSplit: { type: Number, required: true },
  price: { type: Number, required: true },
  moneyRetained: {
    type: Number,
    default: 0,
  }
});

const dataSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  rawMaterial: [rawMaterialSchema],
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  debt: { debtSchema },
  moneyRetained: { moneyRetainedSchema },
  note: { type: String },
});

const dailySupplySchema = new mongoose.Schema({
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts', required: true },
  name: { type: String, required: true },
  data: [dataSchema],
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  limitData: { type: Number },
  areaDimension: { type: Number },
  remainingAreaDimension: {
    type: Number,
    default: function() {
      return this.areaDimension;
    },
  },
  contractDuration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  areaPrice: { type: Number },
  address: { type: String, required: true },
  slug: { type: String, slug: 'name' },
});

const Supplier = mongoose.model('Supplier', supplierSchema);
const DailySupply = mongoose.model('DailySupply', dailySupplySchema);

module.exports = {
  Supplier,
  DailySupply,
};