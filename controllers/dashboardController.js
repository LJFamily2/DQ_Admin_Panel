const RawMaterialModel = require("../models/rawMaterialModel");
const ProductModel = require("../models/productModel");
const SpendModel = require("../models/spendModel");
const SaleModel = require("../models/saleModel");
const ProductTotalModel = require("../models/productTotalModel");

const formatTotalData = require("./utils/formatTotalData");

module.exports = {
  renderPage,
  getRawMaterial,
  getProductData,
  getRevenueAndSpending,
};

async function renderPage(req, res) {
  try {
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    res.set("Cache-Control", "public, max-age=300"); // Cache for 5 minutes
    res.render("src/dashboard", {
      layout: "./layouts/defaultLayout",
      title: "Tổng dữ liệu",
      total,
      user: req.user,
    });
  } catch (err) {
    res.status(500).render("partials/500", { layout: false });
  }
}

const currentYear = new Date().getFullYear();

async function getRawMaterial(req, res) {
  try {
    const rawMaterialData = await RawMaterialModel.aggregate([
      {
        $project: {
          month: { $month: "$date" },
          year: { $year: "$date" },
          dryRubber: {
            $divide: [
              {
                $multiply: ["$products.dryQuantity", "$products.dryPercentage"],
              },
              100,
            ],
          },
          keQuantity: "$products.keQuantity",
          mixedQuantity: "$products.mixedQuantity",
        },
      },
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalDryRubber: { $sum: "$dryRubber" },
          totalKeQuantity: { $sum: "$keQuantity" },
          totalMixedQuantity: { $sum: "$mixedQuantity" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const result = rawMaterialData.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      totalDryRubber: item.totalDryRubber,
      totalKeQuantity: item.totalKeQuantity,
      totalMixedQuantity: item.totalMixedQuantity,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
}

async function getProductData(req, res) {
  try {
    const productData = await ProductModel.aggregate([
      {
        $project: {
          month: { $month: "$date" },
          year: { $year: "$date" },
          dryRubber: {
            $divide: [{ $multiply: ["$dryRubberUsed", "$dryPercentage"] }, 100],
          },
          quantity: "$quantity",
        },
      },
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalDryRubber: { $sum: "$dryRubber" },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const result = productData.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      totalDryRubber: item.totalDryRubber,
      totalQuantity: item.totalQuantity,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}

async function getRevenueAndSpending(req, res) {
  try {
    // Aggregate spending data
    const spendData = await SpendModel.aggregate([
      {
        $project: {
          month: { $month: "$date" },
          year: { $year: "$date" },
          total: { $multiply: ["$quantity", "$price"] },
        },
      },
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalSpending: { $sum: "$total" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Aggregate sales data
    const saleData = await SaleModel.aggregate([
      { $unwind: "$products" },
      {
        $project: {
          month: { $month: "$products.date" },
          year: { $year: "$products.date" },
          total: {
            $cond: {
              if: { $eq: ["$products.name", "dryRubber"] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $multiply: [
                          "$products.quantity",
                          "$products.percentage",
                        ],
                      },
                      100,
                    ],
                  },
                  "$products.price",
                ],
              },
              else: { $multiply: ["$products.quantity", "$products.price"] },
            },
          },
        },
      },
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalRevenue: { $sum: "$total" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Combine the results
    const combinedData = {};

    spendData.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!combinedData[key]) {
        combinedData[key] = { totalSpending: 0, totalRevenue: 0 };
      }
      combinedData[key].totalSpending = item.totalSpending;
    });

    saleData.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!combinedData[key]) {
        combinedData[key] = { totalSpending: 0, totalRevenue: 0 };
      }
      combinedData[key].totalRevenue = item.totalRevenue;
    });

    // Convert combinedData to an array
    const result = Object.keys(combinedData).map((key) => {
      const [year, month] = key.split("-");
      return {
        year: parseInt(year),
        month: parseInt(month),
        totalSpending: combinedData[key].totalSpending,
        totalRevenue: combinedData[key].totalRevenue,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}
