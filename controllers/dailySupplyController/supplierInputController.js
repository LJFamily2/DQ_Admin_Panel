const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require("../../models/dailySupplyModel");
const ActionHistory = require("../../models/actionHistoryModel");
const DateRangeAccessSetting = require("../../models/dateRangeAccessModel");

const handleResponse = require("../utils/handleResponse");
const convertToDecimal = require("../utils/convertToDecimal");
const trimStringFields = require("../utils/trimStringFields");
const calculateFinancials = require("../dailySupplyController/helper/calculateFinancials");

module.exports = {
  renderInputDataDashboardPage,
  renderInputDataPage,
  addData,
  updateSupplierData,
  deleteSupplierData,
};

async function renderInputDataDashboardPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    let areas;
    if (req.user.role === "Hàm lượng") {
      const area = await DailySupply.findOne({ accountID: req.user._id })
        .populate("suppliers")
        .populate("data.supplier");
      areas = area ? [area] : [];
    } else {
      areas = await DailySupply.find()
        .populate("suppliers")
        .populate("data.supplier");
    }

    // Group by area
    const groupedAreas = areas.reduce((acc, area) => {
      if (!acc[area.area]) {
        acc[area.area] = [];
      }
      acc[area.area].push(area);
      return acc;
    }, {});

    res.render("src/dailySupplyInputDashboardPage", {
      layout: "./layouts/defaultLayout",
      title: `Nguyên liệu hằng ngày`,
      groupedAreas,
      areas,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error adding suppliers:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function renderInputDataPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const area = await DailySupply.findOne({
      slug: req.params.slug,
    })
      .populate("suppliers")
      .populate("data.supplier");

    if (!area) {
      return res.status(404).render("partials/404", { layout: false });
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(startOfToday.getUTCHours() + 7);
    const endOfToday = new Date();
    endOfToday.setUTCHours(endOfToday.getUTCHours() + 7);

    const todayEntriesCount = await DailySupply.aggregate([
      { $match: { _id: area._id } },
      { $unwind: "$data" },
      { $match: { "data.date": { $gte: startOfToday, $lte: endOfToday } } },
      { $count: "count" },
    ]);

    const limitReached =
      todayEntriesCount.length > 0
        ? todayEntriesCount[0].count >= area.limitData
        : false;

    res.render("src/dailySupplyInputPage", {
      layout: "./layouts/defaultLayout",
      title: `Nguyên liệu hằng ngày ${area.name}`,
      area,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
      limitReached,
    });
  } catch (error) {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function addData(req, res) {
  try {
    req.body = trimStringFields(req.body);

    const today = new Date();
    today.setUTCHours(today.getUTCHours() + 7);

    const dailySupply = await DailySupply.findById(req.params.id);
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy vườn!",
        req.headers.referer
      );
    }

    const todayEntries = dailySupply.data.filter(
      (entry) => new Date(entry.date).toDateString() === today.toDateString()
    );
    if (
      todayEntries.length >= dailySupply.limitData &&
      dailySupply.limitData !== 0
    ) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Đã đạt giới hạn dữ liệu hàng ngày!",
        req.headers.referer
      );
    }

    const existedSupplier = await Supplier.findOne({
      supplierSlug: req.body.supplier,
    });
    if (!existedSupplier) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Nhà vườn không tồn tại!",
        req.headers.referer
      );
    }

    const rawMaterials = req.body.name.map((name, index) => ({
      name,
      percentage:
        name === "Mủ nước" ? convertToDecimal(req.body.percentage) : 0,
      ratioSplit: existedSupplier.ratioRubberSplit,
      quantity: convertToDecimal(req.body.quantity[index] || 0),
      price: 0,
    }));

    let debt, moneyRetained;
    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      [debt, moneyRetained] = await Promise.all([
        Debt.create({
          date: today,
          debtPaidAmount: 0,
        }),
        MoneyRetained.create({
          date: today,
          retainedAmount: 0,
          percentage: existedSupplier.moneyRetainedPercentage,
        }),
      ]);
    }

    const inputedData = {
      date: today,
      rawMaterial: rawMaterials,
      supplier: existedSupplier._id,
      note: trimStringFields(req.body.note) || "",
      ...(debt && { debt: debt._id }),
      ...(moneyRetained && { moneyRetained: moneyRetained._id }),
    };

    const [newData, updateSupplier] = await Promise.all([
      DailySupply.findByIdAndUpdate(
        req.params.id,
        { $push: { data: inputedData } },
        { new: true, upsert: true }
      ),
      (async () => {
        if (debt?._id) {
          existedSupplier.debtHistory.push(debt._id);
        }
        if (moneyRetained?._id) {
          existedSupplier.moneyRetainedHistory.push(moneyRetained._id);
        }
        return existedSupplier.save();
      })(),
    ]);

    if (!newData || !updateSupplier) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Thêm dữ liệu thất bại!",
        req.headers.referer
      );
    }

    const actionHistory = await ActionHistory.create({
      actionType: "create",
      userId: req.user._id,
      details: `Thêm dữ liệu cho ${existedSupplier.name} của vườn ${newData.name}`,
      newValues: inputedData,
    });

    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Thêm dữ liệu thất bại!",
        req.headers.referer
      );
    }

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Thêm dữ liệu thành công!",
      req.headers.referer
    );
  } catch (error) {
    console.error("Error adding suppliers:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updateSupplierData(req, res) {
  try {
    const { id } = req.params;
    req.body = trimStringFields(req.body);
    const {
      date,
      supplier,
      muNuocQuantity,
      muNuocPercentage,
      muNuocRatioSplit,
      muTapQuantity,
      muTapRatioSplit,
      muKeQuantity,
      muKeRatioSplit,
      muDongQuantity,
      muDongRatioSplit,
      muNuocPrice,
      muTapPrice,
      muKePrice,
      muDongPrice,
      note,
      moneyRetainedPercentage,
    } = req.body;
    // Find the daily supply data by id and populate the debt and moneyRetained fields
    const dailySupply = await DailySupply.findOne({ "data._id": id }).populate({
      path: "data",
      populate: ["debt", "moneyRetained"],
    });
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy dữ liệu!",
        req.headers.referer
      );
    }

    // Find the specific data entry by id
    const dataEntry = dailySupply.data.id(id);
    if (!dataEntry) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy dữ liệu!",
        req.headers.referer
      );
    }

    // Store the current data before updating
    const dataBeforeUpdate = JSON.parse(JSON.stringify(dataEntry));

    // Check if the new date is within the range of DateRangeAccessSetting
    const dateRangeSetting = await DateRangeAccessSetting.findOne();
    if (dateRangeSetting) {
      const newDate = new Date(date).setUTCHours(0, 0, 0, 0);
      const startDate = new Date(dateRangeSetting.startDate).setUTCHours(
        0,
        0,
        0,
        0
      );
      const endDate = new Date(dateRangeSetting.endDate).setUTCHours(
        23,
        59,
        59,
        999
      );

      if (
        req.user.role !== "Admin" &&
        (newDate < startDate || newDate > endDate)
      ) {
        return handleResponse(
          req,
          res,
          403,
          "fail",
          "Ngày cập nhật nằm ngoài phạm vi cho phép!",
          req.headers.referer
        );
      }
    }

    // Update the raw material data
    dataEntry.rawMaterial.forEach((item) => {
      switch (item.name) {
        case "Mủ nước":
          item.quantity = convertToDecimal(muNuocQuantity);
          item.percentage = convertToDecimal(muNuocPercentage);
          item.ratioSplit =
            muNuocRatioSplit !== undefined
              ? convertToDecimal(muNuocRatioSplit)
              : item.ratioSplit !== undefined
              ? item.ratioSplit
              : 0;
          item.price =
            muNuocPrice !== undefined
              ? convertToDecimal(muNuocPrice)
              : item.price !== undefined
              ? item.price
              : 0;
          break;
        case "Mủ tạp":
          item.quantity = convertToDecimal(muTapQuantity);
          item.ratioSplit =
            muTapRatioSplit !== undefined
              ? convertToDecimal(muTapRatioSplit)
              : item.ratioSplit !== undefined
              ? item.ratioSplit
              : 0;
          item.price =
            muTapPrice !== undefined
              ? convertToDecimal(muTapPrice)
              : item.price !== undefined
              ? item.price
              : 0;
          break;
        case "Mủ ké":
          item.quantity = convertToDecimal(muKeQuantity);
          item.ratioSplit =
            muKeRatioSplit !== undefined
              ? convertToDecimal(muKeRatioSplit)
              : item.ratioSplit !== undefined
              ? item.ratioSplit
              : 0;
          item.price =
            muKePrice !== undefined
              ? convertToDecimal(muKePrice)
              : item.price !== undefined
              ? item.price
              : 0;
          break;
        case "Mủ đông":
          item.quantity = convertToDecimal(muDongQuantity);
          item.ratioSplit =
            muDongRatioSplit !== undefined
              ? convertToDecimal(muDongRatioSplit)
              : item.ratioSplit !== undefined
              ? item.ratioSplit
              : 0;
          item.price =
            muDongPrice !== undefined
              ? convertToDecimal(muDongPrice)
              : item.price !== undefined
              ? item.price
              : 0;
          break;
      }
    });
    dataEntry.date = new Date(date).setUTCHours(new Date().getUTCHours() + 7, new Date().getMinutes(), new Date().getSeconds());
    dataEntry.note = trimStringFields(note) || "";

    if (supplier) {
      const supplierDoc = await Supplier.findOne({ supplierSlug: supplier });
      if (!supplierDoc) {
        return handleResponse(
          req,
          res,
          400,
          "fail",
          "Nhà vườn không tồn tại!",
          req.headers.referer
        );
      }
      dataEntry.supplier = supplierDoc._id;
    }

    const updatePromises = [dailySupply.save()];

    // Update the debt and moneyRetained data if the area price and dimension are set
    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      const { debtPaid, retainedAmount } = calculateFinancials(
        dataEntry.rawMaterial,
        convertToDecimal(moneyRetainedPercentage) ||
          convertToDecimal(dataEntry.moneyRetained.percentage.toString())
      );

      const debtPaidDifference =
        debtPaid - (dataEntry.debt.debtPaidAmount || 0);
      const moneyRetainedDifference =
        retainedAmount - (dataEntry.moneyRetained.retainedAmount || 0);

      if (!isNaN(debtPaidDifference)) {
        updatePromises.push(
          Debt.findByIdAndUpdate(
            dataEntry.debt._id,
            { $inc: { debtPaidAmount: debtPaidDifference } },
            { new: true }
          )
        );
      }

      const moneyRetainedUpdate = {
        percentage:
          convertToDecimal(moneyRetainedPercentage) ||
          convertToDecimal(dataEntry.moneyRetained.percentage.toString()),
        retainedAmount: !isNaN(moneyRetainedDifference)
          ? dataEntry.moneyRetained.retainedAmount + moneyRetainedDifference
          : dataEntry.moneyRetained.retainedAmount,
      };

      updatePromises.push(
        MoneyRetained.findByIdAndUpdate(
          dataEntry.moneyRetained._id,
          moneyRetainedUpdate,
          { new: true }
        )
      );
    }

    const [updatedDailySupply] = await Promise.all(updatePromises);

    if (!updatedDailySupply) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Cập nhật dữ liệu thất bại!",
        req.headers.referer
      );
    }

    // Add the action history
    const actionHistory = await ActionHistory.create({
      actionType: "update",
      userId: req.user._id,
      details: `Cập nhật dữ liệu cho ${updatedDailySupply.name}`,
      oldValues: dataBeforeUpdate,
      newValues: dataEntry,
    });

    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Cập nhật dữ liệu thất bại!",
        req.headers.referer
      );
    }

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật dữ liệu thành công!",
      req.headers.referer
    );
  } catch (err) {
    console.error("Error updating supplier data:", err);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteSupplierData(req, res) {
  try {
    const { id } = req.params;

    const dailySupply = await DailySupply.findOne({ "data._id": id });
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy dữ liệu!",
        req.headers.referer
      );
    }

    const subDocument = dailySupply.data.id(id);
    if (!subDocument) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy dữ liệu con!",
        req.headers.referer
      );
    }

    const supplierId = subDocument.supplier;

    const updatedData = await DailySupply.findOneAndUpdate(
      { "data._id": id },
      { $pull: { data: { _id: id } } },
      { new: true }
    );
    if (!updatedData) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa dữ liệu thất bại!",
        req.headers.referer
      );
    }

    let updateSupplierDataPromise;
    const deletePromises = [];

    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      const { debt: debtId, moneyRetained: moneyRetainedId } = subDocument;

      updateSupplierDataPromise = Supplier.findByIdAndUpdate(
        supplierId,
        {
          $pull: { debtHistory: debtId, moneyRetainedHistory: moneyRetainedId },
        },
        { new: true }
      );

      if (debtId) deletePromises.push(Debt.findByIdAndDelete(debtId));
      if (moneyRetainedId)
        deletePromises.push(MoneyRetained.findByIdAndDelete(moneyRetainedId));
    }

    const actionHistoryPromise = ActionHistory.create({
      actionType: "delete",
      userId: req.user._id,
      details: `Xóa dữ liệu cho ${updatedData.name}`,
      oldValues: subDocument,
    });

    const promises = [...deletePromises, actionHistoryPromise];
    if (updateSupplierDataPromise) promises.push(updateSupplierDataPromise);

    const results = await Promise.all(promises);
    const updateSupplierData = updateSupplierDataPromise ? results.pop() : null;

    if (updateSupplierDataPromise && !updateSupplierData) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa dữ liệu cho nhà vườn thất bại!",
        req.headers.referer
      );
    }

    dailySupply.deletionRequests = dailySupply.deletionRequests.filter(
      (request) => request.dataId.toString() !== id
    );
    await dailySupply.save();

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa dữ liệu thành công!",
      req.headers.referer
    );
  } catch (err) {
    console.error("Error deleting supplier data:", err);
    res.status(500).render("partials/500", { layout: false });
  }
}
