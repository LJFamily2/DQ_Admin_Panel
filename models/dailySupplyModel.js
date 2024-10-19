const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

// Debt Schema
const debtSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number },
  paid: { type: Number },
});

// Money Retained Schema
const moneyRetainedSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number },
  percentage: { type: Number },
});

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  supplierAddress: { type: String },
  phone: { type: String, required: true },
  identification: { type: String, required: true },
  issueDate: { type: String, required: true },
  manager: { type: Boolean, default: false },
  ratioRubberSplit: { type: Number, default: 100 },
  ratioSumSplit: { type: Number, default: 100 },
  supplierSlug: {
    type: String,
    default: function () {
      return `${this.code}-${Math.floor(100000 + Math.random() * 900000)}`;
    },
  },
  purchasedAreaPrice: { type: Number, default: 0 },
  areaDeposit: { type: Number, default: 0 },
  debtAmount: {
    type: Number,
    default: function () {
      return (
        this.purchasedAreaDimension * this.purchasedAreaPrice - this.areaDeposit
      );
    },
  },
  debtPaidAmount: { type: Number, default: 0 },
  moneyRetainedAmount: { type: Number, default: 0 },
  moneyRetainedPercentage: { type: Number, default: 0 },
  debtHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply' }],
  moneyRetainedHistory: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply' },
  ],
  purchasedAreaDimension: { type: Number, default: 0 },
  areaDuration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
});

// Raw Material Schema
const rawMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  quantity: { type: Number, required: true },
  ratioSplit: { type: Number, required: true },
  price: { type: Number, required: true },
});

// Data Schema
const dataSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  rawMaterial: [rawMaterialSchema],
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  debt: debtSchema,
  moneyRetained: moneyRetainedSchema,
  note: { type: String },
});

// Daily Supply Schema
const dailySupplySchema = new mongoose.Schema({
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
  name: { type: String, required: true },
  data: [dataSchema],
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  limitData: { type: Number },
  areaDimension: { type: Number },
  remainingAreaDimension: {
    type: Number,
    default: function () {
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
