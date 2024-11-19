const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

// Debt  Schema (not exported)
const debtSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  debtPaidAmount: { type: Number, default: 0 },
});

// Retained Money  Schema (not exported)
const retainedSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  retainedAmount: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
});

// Raw Material Schema (with Finalized Price)
const rawMaterialSchema = new mongoose.Schema({
  name: { type: String },
  percentage: { type: Number },
  quantity: { type: Number },
  ratioSplit: { type: Number },
  price: { type: Number },
});

// Data Schema (Daily Entry)
const dataSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  rawMaterial: [rawMaterialSchema],
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'suppliers' },
  note: { type: String },
  debt: { type: mongoose.Schema.Types.ObjectId, ref: 'debts' },
  moneyRetained: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'moneyRetaineds',
  },
});

// Suppliers Schema
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    supplierAddress: { type: String },
    phone: { type: String, required: true },
    identification: { type: String, required: true },
    issueDate: { type: String, required: true },
    manager: { type: Boolean, default: false },
    ratioRubberSplit: { type: Number, default: 100 },
    ratioSumSplit: { type: Number, default: 100 },
    purchasedAreaPrice: { type: Number, default: 0 },
    areaDeposit: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    initialDebtAmount: {
      type: Number,
      default: function () {
        return (
          this.purchasedAreaDimension * this.purchasedAreaPrice -
          this.areaDeposit
        );
      },
    },
    debtHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'debts' }],
    moneyRetainedHistory: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'moneyRetaineds' },
    ],
    moneyRetainedPercentage: { type: Number, default: 0 },
    purchasedAreaDimension: { type: Number, default: 0 },
    areaDuration: {
      start: { type: Date },
      end: { type: Date },
    },
    supplierSlug: {
      type: String,
      default: function () {
        return `${this.code}-${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },
  },
);

// Daily Supply Schema
const dailySupplySchema = new mongoose.Schema({
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
  name: { type: String, required: true },
  data: [dataSchema],
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'suppliers' }],
  limitData: { type: Number },
  areaDimension: { type: Number, default: 0 },
  remainingAreaDimension: {
    type: Number,
    default: function () {
      return this.areaDimension;
    },
  },
  contractDuration: {
    start: { type: Date },
    end: { type: Date },
  },
  areaPrice: { type: Number, default: 0 },
  address: { type: String, required: true },
  slug: { type: String, slug: 'name' },
  deletionRequests: [
    {
      requestedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
      reason: String,
      requestedAt: { type: Date, default: Date.now },
      status: { type: String, default: 'pending' },
      dataId: {type: mongoose.Schema.Types.ObjectId}
    }
  ]
});



// Models Export
const Debt = mongoose.model('debts', debtSchema);
const MoneyRetained = mongoose.model('moneyRetaineds', retainedSchema);
const Supplier = mongoose.model('suppliers', supplierSchema);
const DailySupply = mongoose.model('dailysupplies', dailySupplySchema);

module.exports = {
  Supplier,
  DailySupply,
  Debt,
  MoneyRetained,
};
