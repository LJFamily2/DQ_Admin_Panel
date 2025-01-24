const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require("../../models/dailySupplyModel");
const ActionHistory = require("../../models/actionHistoryModel");
const DateRangeAccess = require("../../models/dateRangeAccessModel");
const {
  getIndividualSupplierExportData,
} = require("./getSupplierDataController");

const trimStringFields = require("../utils/trimStringFields");
const handleResponse = require("../utils/handleResponse");
const convertToDecimal = require("../utils/convertToDecimal");
const updatePricesAndRatiosHelper = require("../utils/updatePricesAndRatiosHelper");
const calculateFinancials = require("../dailySupplyController/helper/calculateFinancials");
module.exports = {
  renderPage,
  updatePricesAndRatios,
  renderAllData,
};
async function renderPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const dateRangeAccess = await DateRangeAccess.findOne();
    const area = await DailySupply.findOne({ slug: req.params.slug }).populate(
      "suppliers"
    );

    res.render("src/dailySupplyExportPage", {
      layout: "./layouts/defaultLayout",
      title: `Xuất dữ liệu mủ của ${area.name}`,
      area,
      user: req.user,
      startDate,
      dateRangeAccess,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error adding suppliers:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updatePricesAndRatios(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const {
      startDate,
      endDate,
      dryPrice,
      mixedPrice,
      kePrice,
      dongPrice,
      drySplit,
      mixedSplit,
      keSplit,
      dongSplit,
    } = req.body;
    const { slug, supplierSlug } = req.params;

    const area = await DailySupply.findOne({ slug }).populate({
      path: "data",
      populate: ["debt", "moneyRetained"],
    });

    if (!area) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy vườn cung cấp",
        req.headers.referer
      );
    }

    const start = new Date(startDate || endDate || new Date());
    const end = new Date(endDate || startDate || new Date());
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const prices = {
      dryPrice: convertToDecimal(dryPrice),
      mixedPrice: convertToDecimal(mixedPrice),
      kePrice: convertToDecimal(kePrice),
      dongPrice: convertToDecimal(dongPrice),
    };

    const ratios = {
      "Mủ nước": convertToDecimal(drySplit),
      "Mủ tạp": convertToDecimal(mixedSplit),
      "Mủ ké": convertToDecimal(keSplit),
      "Mủ đông": convertToDecimal(dongSplit),
    };

    let supplierId = null;
    if (supplierSlug) {
      const supplier = await Supplier.findOne({ supplierSlug: supplierSlug });
      if (!supplier) {
        return handleResponse(
          req,
          res,
          404,
          "fail",
          "Không tìm thấy nhà cung cấp",
          req.headers.referer
        );
      }
      supplierId = supplier._id;
    }

    const initialAreaData = area.data;
    // Update prices and ratios
    area.data = updatePricesAndRatiosHelper(
      area.data,
      start,
      end,
      prices,
      ratios,
      supplierId
    );

    let bulkDebtOps = [];
    let bulkMoneyRetainedOps = [];

    if (area.areaPrice > 0 && area.areaDimension > 0) {
      // Calculate and update debt and money retained for each data entry
      for (const entry of area.data) {
        const { debtPaid, retainedAmount } = calculateFinancials(
          entry.rawMaterial,
          entry.moneyRetained.percentage
        );

        const debtAmount = entry.debt;
        const moneyRetainedAmount = entry.moneyRetained;
        // Store old values
        const oldDebtPaidAmount = debtAmount.debtPaidAmount || 0;
        const oldMoneyRetainedAmount = moneyRetainedAmount.retainedAmount || 0;

        // Validate and ensure numeric values
        const debtPaidDifference = (debtPaid || 0) - oldDebtPaidAmount;
        const moneyRetainedDifference =
          (retainedAmount || 0) - oldMoneyRetainedAmount;

        // Prepare bulk update operations
        bulkDebtOps.push({
          updateOne: {
            filter: { _id: debtAmount._id },
            update: { $inc: { debtPaidAmount: debtPaidDifference } },
          },
        });

        bulkMoneyRetainedOps.push({
          updateOne: {
            filter: { _id: moneyRetainedAmount._id },
            update: { $inc: { retainedAmount: moneyRetainedDifference } },
          },
        });
      }
    }

    // Execute bulk update operations concurrently
    if (bulkDebtOps.length > 0) {
      await Debt.bulkWrite(bulkDebtOps);
    }
    if (bulkMoneyRetainedOps.length > 0) {
      await MoneyRetained.bulkWrite(bulkMoneyRetainedOps);
    }

    const [saveData, actionHistory] = await Promise.all([
      area.save(),
      ActionHistory.create({
        actionType: "update",
        userId: req.user._id,
        details: `Cập nhật giá cho vườn ${area.name}`,
        oldValues: initialAreaData,
        newValues: area.data,
      }),
    ]);

    if (!saveData) {
      return handleResponse(
        req,
        res,
        500,
        "fail",
        "Lỗi cập nhật dữ liệu!",
        req.headers.referer
      );
    }
    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        500,
        "fail",
        "Lỗi lưu lịch sử dữ liệu!",
        req.headers.referer
      );
    }

    const successMessage = supplierSlug
      ? "Cập nhật giá thành công cho nhà cung cấp"
      : "Cập nhật giá thành công cho vườn";
    return handleResponse(
      req,
      res,
      200,
      "success",
      successMessage,
      req.headers.referer
    );
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function renderAllData(req, res) {
  try {
    const { slug } = req.params;
    const { startDate, endDate } = req.query;

    // Fetch the DailySupply document with suppliers
    const dailySupply = await DailySupply.findOne({ slug }).populate({
      path: "suppliers",
      populate: ["moneyRetainedHistory", "debtHistory"],
    });

    if (!dailySupply) {
      return res.status(404).render("partials/404", { layout: false });
    }

    // Initialize array to hold all supplier data
    const allSupplierData = [];

    // Process each supplier
    for (const supplier of dailySupply.suppliers) {
      try {
        // Get individual supplier export data
        const supplierData = await getIndividualSupplierExportData(
          {
            params: { slug, supplierSlug: supplier.supplierSlug },
            query: { startDate, endDate },
          },
          res,
          false
        );

        // Only process suppliers that have data within the date range
        if (supplierData.data.length > 0) {
          // Calculate supplier-specific totals
          const totalDebtPaidAmount = supplier.debtHistory.reduce(
            (total, debt) => total + (debt.debtPaidAmount || 0),
            0
          );

          const totalMoneyRetainedAmount = supplier.moneyRetainedHistory.reduce(
            (total, retained) => total + (retained.retainedAmount || 0),
            0
          );

          // Calculate remaining debt for this supplier
          const remainingDebt = supplier.initialDebtAmount - totalDebtPaidAmount;
          // Add supplier data with their specific calculations
          allSupplierData.push({
            supplierName: supplier.name,
            supplierCode: supplier.code,
            ratioSumSplit: supplier.ratioSumSplit,
            moneyRetainedPercentage: supplier.moneyRetainedPercentage,
            initialDebtAmount: supplier.initialDebtAmount,
            remainingDebt: remainingDebt,
            totalMoneyRetained: totalMoneyRetainedAmount,
            data: supplierData.data,
            latestPrices: supplierData.latestPrices,
          });
        }
      } catch (error) {
        console.error(
          `Error fetching data for supplier ${supplier.supplierSlug}:`,
          error
        );
      }
    }

    // Sort suppliers alphabetically
    allSupplierData.sort((a, b) => {
      return a.supplierName.toLowerCase().localeCompare(b.supplierName.toLowerCase());
    });

    // Render the page with collected data
    res.render("src/dailySupplyExportAllPage", {
      layout: false,
      data: allSupplierData,
      user: req.user,
      area: dailySupply,
      title: "Xuất dữ liệu mủ của tất cả nhà cung cấp",
      startDate,
      endDate,
      latestPrices: allSupplierData.length > 0 ? allSupplierData[0].latestPrices : {},
    });
  } catch (error) {
    console.error("Error fetching supplier data:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}