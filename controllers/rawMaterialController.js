const trimStringFields = require("./utils/trimStringFields");
const handleResponse = require("./utils/handleResponse");
const RawMaterialModel = require("../models/rawMaterialModel");
const ProductTotalModel = require("../models/productTotalModel");
const convertToDecimal = require("./utils/convertToDecimal");
const formatTotalData = require("./utils/formatTotalData");
const ActionHistory = require("../models/actionHistoryModel");

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
  deleteData,
  deleteAll,
};

async function renderPage(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    const datas = await RawMaterialModel.find({});

    res.render("src/rawMaterialPage", {
      layout: "./layouts/defaultLayout",
      datas,
      total,
      startDate,
      endDate,
      user: req.user,
      messages: req.flash(),
      title: "Nguyên liệu",
    });
  } catch {
    return res.status(500).render("partials/500", { layout: false });
  }
}

function calculateTotalDryRubber(product) {
  return (product.dryQuantity * product.dryPercentage) / 100;
}
async function updateProductTotal(data, operation) {
  const multiplier = operation === "add" ? 1 : -1;
  const totalDryRubber = calculateTotalDryRubber(data.products) * multiplier;
  const mixedQuantityRounded = data.products.mixedQuantity * multiplier;
  const keQuantity =
    ((data.products.keQuantity * data.products.kePercentage) / 100) *
    multiplier;

  const updateData = {
    $inc: {
      dryRubber: totalDryRubber,
      mixedQuantity: mixedQuantityRounded + keQuantity,
    },
  };

  const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });
  return total;
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  try {
    let date = await RawMaterialModel.findOne({ date: req.body.date });
    if (date) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Đã có dữ liệu ngày này. Hãy chọn ngày khác!",
        req.headers.referer
      );
    }

    products = {
      dryQuantity: convertToDecimal(req.body.dryQuantity) || 0,
      dryPercentage: convertToDecimal(req.body.dryPercentage) || 0,
      keQuantity: convertToDecimal(req.body.keQuantity) || 0,
      kePercentage: convertToDecimal(req.body.kePercentage) || 0,
      mixedQuantity: convertToDecimal(req.body.mixedQuantity) || 0,
    };
    const newData = await RawMaterialModel.create({
      ...req.body,
      products: products,
    });
    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo dữ liệu thất bại",
        req.headers.referer
      );
    }

    calculateTotalDryRubber(products);

    const total = await updateProductTotal({ products }, "add");

    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo dữ liệu thất bại",
        req.headers.referer
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Tạo dữ liệu thành công",
      req.headers.referer
    );
    await ActionHistory.create({
      actionType: "create",
      userId: req.user._id,
      details: "Created new raw material data",
      newValues: newData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).render("partials/500", { layout: false });
  }
}

async function getDatas(req, res) {
  try {
    const {
      draw,
      start = 0,
      length = 10,
      search,
      order,
      columns,
      startDate,
      endDate,
    } = req.body;

    const searchValue = search?.value?.toLowerCase() || "";
    const sortColumnIndex = order?.[0]?.column;
    let sortColumn = columns?.[sortColumnIndex]?.data;
    let sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    const filter = {};

    if (startDate || endDate) {
      filter.date = {};

      const filterStartDate = new Date(startDate || endDate);
      filterStartDate.setHours(0, 0, 0, 0);
      filter.date.$gte = filterStartDate;

      const filterEndDate = new Date(endDate || startDate);
      filterEndDate.setHours(23, 59, 59, 999);
      filter.date.$lte = filterEndDate;
    }

    // Determine if the sort column is 'date'
    const isSortingByDate = sortColumn === "date";

    const sortObject = isSortingByDate
      ? { [sortColumn]: sortDirection }
      : { date: -1 };

    const totalRecords = await RawMaterialModel.countDocuments(filter);
    let dataQuery = RawMaterialModel.find(filter).sort(sortObject);

    // If length is -1, fetch all records
    if (parseInt(length, 10) !== -1) {
      dataQuery = dataQuery
        .skip(parseInt(start, 10))
        .limit(parseInt(length, 10));
    }

    let data = await dataQuery;

    data.sort((a, b) => {
      const valueA =
        (sortColumn === "date" ? new Date(a.date) : a.products[sortColumn]) ||
        "";
      const valueB =
        (sortColumn === "date" ? new Date(b.date) : b.products[sortColumn]) ||
        "";
      return valueA < valueB
        ? -sortDirection
        : valueA > valueB
        ? sortDirection
        : 0;
    });

    const filteredRecords = await RawMaterialModel.countDocuments(filter);

    const formattedData = data.map((item, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: new Date(item.date).toLocaleDateString("vi-VN"),
      dryQuantity: item.products.dryQuantity.toLocaleString("vi-VN"),
      dryPercentage: item.products.dryPercentage.toLocaleString("vi-VN"),
      dryTotal: (
        (item.products.dryQuantity * item.products.dryPercentage) /
        100
      ).toLocaleString("vi-VN"),
      mixedQuantity: item.products.mixedQuantity.toLocaleString("vi-VN"),
      keQuantity: item.products.keQuantity.toLocaleString("vi-VN"),
      kePercentage: item.products.kePercentage.toLocaleString("vi-VN"),
      keTotal: (
        (item.products.keQuantity * item.products.kePercentage) /
        100
      ).toLocaleString("vi-VN"),
      notes: item.notes || "",
      id: item._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: formattedData,
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updateData(req, res) {
  try {
    const { id } = req.params;
    const date = await RawMaterialModel.findOne({ date: req.body.date });
    if (date && date._id.toString() !== id) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Đã có dữ liệu ngày này. Hãy chọn ngày khác !",
        req.headers.referer
      );
    }

    const products = {
      dryQuantity: convertToDecimal(req.body.dryQuantity) || 0,
      dryPercentage: convertToDecimal(req.body.dryPercentage) || 0,
      keQuantity: convertToDecimal(req.body.keQuantity) || 0,
      kePercentage: convertToDecimal(req.body.kePercentage) || 0,
      mixedQuantity: convertToDecimal(req.body.mixedQuantity) || 0,
    };

    // Prepare the fields to be updated
    const updateFields = {
      ...req.body,
      notes: req.body.notes,
      products,
    };

    // Retrieve the old data before updating
    const oldData = await RawMaterialModel.findById(id);

    // Update the data with new values
    const newData = await RawMaterialModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật thông tin thất bại",
        req.headers.referer
      );
    }

    const {
      dryQuantity: newDryQuantity,
      dryPercentage: newDryPercentage,
      keQuantity: newKeQuantity,
      kePercentage: newKePercentage,
      mixedQuantity: newMixedQuantity,
    } = newData.products;
    const {
      dryQuantity: oldDryQuantity = 0,
      dryPercentage: oldDryPercentage = 0,
      keQuantity: oldKeQuantity = 0,
      kePercentage: oldKePercentage = 0,
      mixedQuantity: oldMixedQuantity = 0,
    } = oldData.products || {};

    // Calculate differences
    const mixedQuantityDiff = newMixedQuantity - oldMixedQuantity;
    const dryRubberDiff =
      (newDryQuantity * newDryPercentage - oldDryQuantity * oldDryPercentage) /
      100;
    const keRubberDiff =
      (newKeQuantity * newKePercentage - oldKeQuantity * oldKePercentage) /
      100;

    // Initialize update object with mixedQuantity difference
    const updateData = {
      $inc: { mixedQuantity: mixedQuantityDiff + keRubberDiff },
    };

    if (Math.abs(dryRubberDiff) >= 0.01) {
      updateData.$inc.dryRubber = dryRubberDiff;
    }

    // Perform the update
    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật thông tin thất bại",
        req.headers.referer
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật thông tin thành công",
      req.headers.referer
    );
    await ActionHistory.create({
      actionType: "update",
      userId: req.user._id,
      details: "Updated raw material data",
      oldValues: oldData,
      newValues: newData,
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteData(req, res) {
  try {
    const { id } = req.params;

    // Find the data to be deleted
    const data = await RawMaterialModel.findByIdAndDelete(id);

    if (!data) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa dữ liệu thất bại",
        req.headers.referer
      );
    }

    // Calculate the total dry rubber to be subtracted
    calculateTotalDryRubber(data.products);

    // Update the ProductTotal document efficiently
    await updateProductTotal({ products: data.products }, "subtract");

    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa dữ liệu thành công",
      req.headers.referer
    );
    await ActionHistory.create({
      actionType: "delete",
      userId: req.user._id,
      details: "Deleted raw material data",
      oldValues: data,
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteAll(req, res) {
  try {
    const [
      {
        totalDryQuantity = 0,
        totalMixedQuantity = 0,
        totalKeQuantity = 0,
      } = {},
    ] = await RawMaterialModel.aggregate([
      {
        $group: {
          _id: null,
          totalDryQuantity: {
            $sum: {
              $divide: [
                {
                  $multiply: [
                    "$products.dryQuantity",
                    "$products.dryPercentage",
                  ],
                },
                100,
              ],
            },
          },
          totalKeQuantity: {
            $sum: {
              $divide: [
                {
                  $multiply: [
                    "$products.keQuantity",
                    "$products.kePercentage",
                  ],
                },
                100,
              ],
            },
          },
          totalMixedQuantity: { $sum: "$products.mixedQuantity" },
        },
      },
    ]);

    await ProductTotalModel.findOneAndUpdate(
      {},
      {
        $inc: {
          dryRubber: -totalDryQuantity,
          mixedQuantity: -(totalMixedQuantity + totalKeQuantity),
        },
      },
      { new: true }
    );

    await RawMaterialModel.deleteMany({});

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả dữ liệu thành công !",
      req.headers.referer
    );
    await ActionHistory.create({
      actionType: "delete",
      userId: req.user._id,
      details: "Deleted all raw material data",
    });
  } catch (err) {
    res.status(500).render("partials/500", { layout: false });
  }
}
