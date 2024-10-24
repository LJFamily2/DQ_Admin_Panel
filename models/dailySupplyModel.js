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
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
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
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  areaPrice: { type: Number, default: 0 },
  address: { type: String, required: true },
  slug: { type: String, slug: 'name' },
});

// ---------------------
// Virtual field for calculating total debt paid amount dynamically
supplierSchema.virtual('totalDebtPaidAmount').get(function () {
  // Ensure debtHistory is populated
  if (!this.debtHistory || !this.debtHistory.length) return 0;

  const totalDebtPaidAmount = this.debtHistory.reduce((total, entry) => {
    return total + (entry.debtPaidAmount || 0);
  }, 0);
  console.log(totalDebtPaidAmount);
  return totalDebtPaidAmount;
});

// Virtual field for calculating total money retained amount dynamically
supplierSchema.virtual('totalMoneyRetainedAmount').get(function () {
  // Ensure moneyRetainedHistory is populated
  if (!this.moneyRetainedHistory || !this.moneyRetainedHistory.length) return 0;

  const totalMoneyRetainedAmount = this.moneyRetainedHistory.reduce(
    (total, entry) => {
      return total + entry.retainedAmount;
    },
    0,
  );
  console.log(totalMoneyRetainedAmount);
  return totalMoneyRetainedAmount;
});

// Virtual field for calculating remaining debt dynamically
supplierSchema.virtual('remainingDebt').get(function () {
  const initialDebtAmount = this.initialDebtAmount || 0;
  const totalDebtPaidAmount = this.totalDebtPaidAmount || 0;
  console.log(initialDebtAmount - totalDebtPaidAmount)
  return initialDebtAmount - totalDebtPaidAmount;
});
// ---------------------

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
