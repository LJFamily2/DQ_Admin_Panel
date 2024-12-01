const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require("../../models/dailySupplyModel");
const ActionHistory = require("../../models/actionHistoryModel");
const DateRangeAccess = require("../../models/dateRangeAccessModel");

const trimStringFields = require("../utils/trimStringFields");
const handleResponse = require("../utils/handleResponse");
const convertToDecimal = require("../utils/convertToDecimal");
const updatePricesAndRatiosHelper = require("../utils/updatePricesAndRatiosHelper");
const calculateFinancials = require("../dailySupplyController/helper/calculateFinancials");
module.exports = {
  renderPage,
  updatePricesAndRatios,
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
  console.log(req.body);
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
