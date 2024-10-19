const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

// Debt History Schema (not exported)
const debtHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  debtPaidAmount: { type: Number, default: 0 },
  referenceData: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply' }, 
});

// Retained Money History Schema (not exported)
const retainedHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  retainedAmount: { type: Number, required: true },
  percentage: { type: Number, default: 0 }, 
  referenceData: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySupply' },
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
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier'},
  note: { type: String },
  debt: { type: mongoose.Schema.Types.ObjectId, ref: 'DebtHistory' },
  moneyRetained: { type: mongoose.Schema.Types.ObjectId, ref: 'RetainedHistory' },
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
  purchasedAreaPrice: { type: Number, default: 0 },
  areaDeposit: { type: Number, default: 0 },
  initialDebtAmount: {type: Number, default: function() {return this.purchasedAreaDimension * this.purchasedAreaPrice - this.areaDeposit} },
  debtHistory: [{ debtHistorySchema }],
  moneyRetainedHistory: [{ retainedHistorySchema }],
  purchasedAreaDimension: { type: Number, default: 0 },
  areaDuration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual field for calculating total debt dynamically
// supplierSchema.virtual('totalDebt').get(function () {
//   return this.debtHistory.reduce((total, history) => total + history.debtAmount, 0);
// });

// // Virtual field for calculating total retained money dynamically
// supplierSchema.virtual('totalRetainedMoney').get(function () {
//   return this.moneyRetainedHistory.reduce((total, history) => total + history.retainedAmount, 0);
// });

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

// Automating Debt and Retained Money Calculation
// rawMaterialSchema.post('save', async function (doc) {
//   if (doc.finalizedPrice) {
//     const updatedData = await calculateDebtAndRetained(doc);
//     await updateSupplierDebtAndRetained(doc.supplierId, updatedData);
//   }
// });

// // Example function for calculating debt and retained money
// async function calculateDebtAndRetained(rawMaterial) {
//   const debt = rawMaterial.finalizedPrice * rawMaterial.quantity * 0.6; // 60% goes to debt
//   const retained = rawMaterial.finalizedPrice * rawMaterial.quantity * 0.4 * 0.05; // 5% of 40%
//   return { debt, retained };
// }

// // Example function for updating supplier debt and retained money
// async function updateSupplierDebtAndRetained(supplierId, updatedData) {
//   const supplier = await Supplier.findById(supplierId);
//   supplier.debtHistory.push({
//     date: new Date(),
//     debtAmount: updatedData.debt,
//     debtPaidAmount: 0,
//   });
//   supplier.moneyRetainedHistory.push({
//     date: new Date(),
//     retainedAmount: updatedData.retained,
//     percentage: 5,
//   });
//   await supplier.save();
// }

// Models Export
const Supplier = mongoose.model('Supplier', supplierSchema);
const DailySupply = mongoose.model('DailySupply', dailySupplySchema);

module.exports = {
  Supplier,
  DailySupply,
};
