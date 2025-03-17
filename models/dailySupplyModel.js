const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
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
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "suppliers" },
  note: { type: String },
  debt: { type: mongoose.Schema.Types.ObjectId, ref: "debts" },
  moneyRetained: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "moneyRetaineds",
  },
});

// Suppliers Schema
const supplierSchema = new mongoose.Schema({
  name: { type: String },
  code: { type: String },
  supplierAddress: { type: String },
  phone: { type: String },
  identification: { type: String },
  issueDate: { type: String },
  manager: { type: Boolean, default: false },
  ratioRubberSplit: { type: Number, default: 100 }, //Tỉ lệ chia mủ
  ratioSumSplit: { type: Number, default: 100 }, //Tỉ lệ chia tổng
  purchasedAreaPrice: { type: Number }, //Giá mua mẫu
  areaDeposit: { type: Number }, //Tiền cọc
  advancePayment: { type: Number }, //Tiền ứng
  initialDebtAmount: {
    type: Number,
    default: function () {
      if (this.purchasedAreaDimension > 0 && this.purchasedAreaPrice > 0) {
        const deposit = this.areaDeposit || 0;
        return this.purchasedAreaDimension * this.purchasedAreaPrice - deposit;
      }
      return 0;
    },
  },
  debtHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "debts" }],
  moneyRetainedHistory: [
    { type: mongoose.Schema.Types.ObjectId, ref: "moneyRetaineds" },
  ],
  moneyRetainedPercentage: { type: Number }, //Phần trăm giữ lại
  purchasedAreaDimension: { type: Number },
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
});

// Daily Supply Schema
const dailySupplySchema = new mongoose.Schema({
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: "Accounts" },
  name: { type: String, required: true },
  area: { type: String, required: true },
  data: [dataSchema],
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: "suppliers" }],
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
  slug: { type: String, slug: "name" },
  deletionRequests: [
    {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Accounts" },
      reason: String,
      requestedAt: { type: Date, default: Date.now },
      status: { type: String, default: "pending" },
      dataId: { type: mongoose.Schema.Types.ObjectId },
    },
  ],
});

// Virtual functions
supplierSchema.virtual("isVerified").get(function () {
  // Validate phone number format (10 digits only)
  const isValidPhone = /^\d{10}$/.test(this.phone || "");

  // Validate identification number format (12 digits only)
  const isValidId = /^\d{12}$/.test(this.identification || "");

  // Validate issue date format (DD/MM/YYYY)
  const isValidDate = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(this.issueDate || "");

  // Sanitize and validate address (min 8 chars, no special chars except basic punctuation)
  const isValidAddress = Boolean(
    this.supplierAddress &&
      this.supplierAddress.length >= 8 &&
      /^[a-zA-Z0-9\s,.-]+$/.test(this.supplierAddress)
  );

  // All conditions must be met
  return Boolean(isValidAddress && isValidPhone && isValidId && isValidDate);
});

// Enable virtual fields in JSON/Object output
supplierSchema.set("toJSON", { virtuals: true });

supplierSchema.set("toObject", { virtuals: true });

// Models Export
const Debt = mongoose.model("debts", debtSchema);
const MoneyRetained = mongoose.model("moneyRetaineds", retainedSchema);
const Supplier = mongoose.model("suppliers", supplierSchema);
const DailySupply = mongoose.model("dailysupplies", dailySupplySchema);

module.exports = {
  Supplier,
  DailySupply,
  Debt,
  MoneyRetained,
};
