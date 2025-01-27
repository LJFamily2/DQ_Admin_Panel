const ProductModel = require("../models/productModel");
const handleResponse = require("./utils/handleResponse");
const trimStringFields = require("./utils/trimStringFields");
const ProductTotalModel = require("../models/productTotalModel");
const formatTotalData = require("./utils/formatTotalData");
const convertToDecimal = require("./utils/convertToDecimal");

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  renderPage,
  deleteAll,
};

async function updateTotal(dryRubberAdjustment, productAdjustment) {
  const updateData = { $inc: {} };

  if (dryRubberAdjustment !== 0) {
    updateData.$inc.dryRubber = dryRubberAdjustment;
  }
  if (productAdjustment !== 0) {
    updateData.$inc.product = productAdjustment;
  }

  // Update the totals in the database
  return await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
  });
}

async function renderPage(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    const products = await ProductModel.find({});

    res.render("src/productPage", {
      layout: "./layouts/defaultLayout",
      title: "Dữ liệu chạy lò",
      products,
      user: req.user,
      total,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updateProductTotals(dryRubberAdjustment, productAdjustment) {
  let updateData = {};
  if (dryRubberAdjustment !== 0) {
    updateData.$inc = {
      ...updateData.$inc,
      // Convert to number after using toFixed to ensure it's stored as a float
      dryRubber: dryRubberAdjustment,
    };
  }
  if (productAdjustment !== 0) {
    updateData.$inc = {
      ...updateData.$inc,
      // Convert to number after using toFixed to ensure it's stored as a float
      product: productAdjustment,
    };
  }

  const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });

  return total;
}

async function createProduct(req, res) {
  req.body = trimStringFields(req.body);

  try {
    let date = await ProductModel.findOne({ date: req.body.date });
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

    let quantity = convertToDecimal(req.body.quantity) || 0;
    let dryRubberUsed = convertToDecimal(req.body.dryRubberUsed) || 0;
    let dryPercentage = convertToDecimal(req.body.dryPercentage) || 0;

    await ProductModel.create({
      ...req.body,
      quantity,
      dryRubberUsed,
      dryPercentage,
    });

    let totalDryRubber = (dryRubberUsed * dryPercentage) / 100;

    // Calculate adjustments
    let dryRubberAdjustment = -totalDryRubber;
    let productAdjustment = quantity;

    await updateProductTotals(dryRubberAdjustment, productAdjustment);

    handleResponse(
      req,
      res,
      201,
      "success",
      "Thêm hàng hóa thành công",
      req.headers.referer
    );
  } catch (err) {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { date, dryRubberUsed, dryPercentage, quantity, notes } = req.body;

    const existingDate = await ProductModel.findOne({ date });
    if (existingDate && existingDate._id.toString() !== id) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Đã có dữ liệu ngày này. Hãy chọn ngày khác!",
        req.headers.referer
      );
    }

    const dryRubberUsedInput = convertToDecimal(dryRubberUsed || 0);
    const dryPercentageInput = convertToDecimal(dryPercentage || 0);
    const quantityInput = convertToDecimal(quantity || 0);

    const updateFields = {
      date,
      dryPercentage: dryPercentageInput,
      dryRubberUsed: dryRubberUsedInput,
      quantity: quantityInput,
      notes: notes.trim(),
    };

    const oldData = await ProductModel.findById(id);
    if (!oldData) {
      return res.status(404).send("Product not found");
    }

    await ProductModel.findByIdAndUpdate(id, updateFields, { new: true });

    const dryRubberUsedDiff =
      (dryRubberUsedInput * dryPercentageInput) / 100 -
      (oldData.dryRubberUsed * oldData.dryPercentage) / 100;
    const quantityDiff = quantityInput - oldData.quantity;

    if (dryRubberUsedDiff !== 0 || quantityDiff !== 0) {
      await updateTotal(-dryRubberUsedDiff, quantityDiff);
    }

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật hàng hóa thành công",
      req.headers.referer
    );
  } catch (error) {
    console.log(error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy hàng hóa trong cơ sở dữ liệu",
        req.headers.referer
      );
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa hàng hóa thất bại",
        req.headers.referer
      );
    }

    let dryRubberAdjustment =
      (deletedProduct.dryRubberUsed * deletedProduct.dryPercentage) / 100;
    let productAdjustment = -deletedProduct.quantity;

    // Update totals
    await updateProductTotals(dryRubberAdjustment, productAdjustment);

    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa hàng hóa thành công",
      req.headers.referer
    );
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function getProducts(req, res) {
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

    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    const searchQuery = searchValue
      ? {
          $or: [{ notes: { $regex: searchValue, $options: "i" } }],
        }
      : {};

    let filter = { ...searchQuery };

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

    const totalRecords = await ProductModel.countDocuments();
    const filteredRecords = await ProductModel.countDocuments(filter);
    let dataQuery = ProductModel.find(filter).sort(sortObject);

    // If length is -1, fetch all records
    if (parseInt(length, 10) !== -1) {
      dataQuery = dataQuery
        .skip(parseInt(start, 10))
        .limit(parseInt(length, 10));
    }

    const products = await dataQuery;

    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: product.date.toLocaleDateString("vi-VN"),
      dryRubberUsed: (
        (product.dryRubberUsed * product.dryPercentage) /
        100
      ).toLocaleString("vi-VN"),
      quantity: product.quantity.toLocaleString("vi-VN") || 0,
      notes: product.notes || "",
      id: product._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteAll(req, res) {
  try {
    const [{ totalDryQuantity = 0, totalProduct = 0 } = {}] =
      await ProductModel.aggregate([
        {
          $group: {
            _id: null,
            totalDryQuantity: {
              $sum: {
                $multiply: [
                  "$dryRubberUsed",
                  { $divide: ["$dryPercentage", 100] },
                ],
              },
            },
            totalProduct: { $sum: "$quantity" },
          },
        },
      ]);

    await ProductTotalModel.findOneAndUpdate(
      {},
      {
        $inc: {
          dryRubber: totalDryQuantity,
          product: -totalProduct,
        },
      },
      {
        new: true,
      }
    );

    await ProductModel.deleteMany({});
    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả hàng hóa thành công !",
      req.headers.referer
    );
  } catch (err) {
    console.log(err)
    res.status(500).render("partials/500", { layout: false });
  }
}
