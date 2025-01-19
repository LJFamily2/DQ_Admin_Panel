const { DailySupply, Supplier } = require("../../models/dailySupplyModel");

module.exports = {
  getData,

  // DetailPage
  getAreaSupplierData,

  // User side for input data
  getSupplierData,

  // Admin side for export data
  getSupplierExportData,

  // Admin side for exportin individual data
  getIndividualSupplierExportData,
};
const formatNumber = (num) => (num = num.toLocaleString("vi-VN"));

// Get today date in UTC+7
function getTodayDate() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function adjustDates(startDate, endDate) {
  const today = getTodayDate();
  if (!startDate && !endDate) {
    return { effectiveStartDate: today, effectiveEndDate: today };
  } else if (startDate && !endDate) {
    return { effectiveStartDate: startDate, effectiveEndDate: today };
  } else if (!startDate && endDate) {
    return { effectiveStartDate: endDate, effectiveEndDate: endDate };
  }
  return { effectiveStartDate: startDate, effectiveEndDate: endDate };
}

function createDateFilter(startDateUTC, endDateUTC) {
  return {
    "data.date": {
      $gte: new Date(startDateUTC),
      $lte: new Date(endDateUTC),
    },
  };
}

function parseDates(startDate, endDate) {
  const { effectiveStartDate, effectiveEndDate } = adjustDates(
    startDate,
    endDate
  );
  const startDateUTC = new Date(effectiveStartDate);
  startDateUTC.setUTCHours(0, 0, 0, 0);
  const endDateUTC = new Date(effectiveEndDate);
  endDateUTC.setUTCHours(23, 59, 59, 999);
  return { startDateUTC, endDateUTC };
}

// Function to calculate contract duration and status
function calculateContractDuration(startDate, endDate) {
  const today = new Date();
  today.setUTCHours(today.getUTCHours() + 7);

  if (!startDate && !endDate) {
    return { duration: null, status: "No contract" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < today) {
    return {
      duration: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      status: "expired",
    };
  } else if (start <= today && end >= today) {
    return {
      duration: Math.ceil((end - today) / (1000 * 60 * 60 * 24)),
      status: "valid",
    };
  }

  return { duration: null, status: "No contract" };
}

async function getData(req, res) {
  try {
    const { draw, start, length, search, order, columns } = req.body;

    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    // Define the filter object based on the search value
    const filter = searchValue
      ? { name: { $regex: searchValue, $options: "i" } }
      : {};

    const sortObject = sortColumn ? { [sortColumn]: sortDirection } : {};

    // Count the total and filtered records
    const totalRecords = await DailySupply.countDocuments();
    const filteredRecords = await DailySupply.countDocuments(filter);

    const products = await DailySupply.find(filter)
      .sort(sortObject)
      .skip(parseInt(start, 10))
      .populate("accountID");

    // Map the products to the desired format
    const data = products.map((product, index) => {
      const { duration, status } = calculateContractDuration(
        product.contractDuration.start,
        product.contractDuration.end
      );
      return {
        no: parseInt(start, 10) + index + 1,
        area: product.name || "",
        accountID: product.accountID?.username || "",
        link: {
          _id: product._id,
          slug: product.slug,
        },
        contractDuration: {
          duration: duration,
          status: status,
        },
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function getSupplierData(req, res) {
  await getSupplierInputData(req, res, true);
}

async function getAreaSupplierData(req, res) {
  await getSupplierInputData(req, res, true);
}

async function getSupplierInputData(req, res, isArea) {
  try {
    const { draw, search, startDate, endDate, start, length } = req.body;
    const searchValue = search?.value?.toLowerCase() || "";

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);
    const matchStage = createMatchStage(
      req.params.slug,
      dateFilter,
      searchValue
    );
    const sortStage = { $sort: { "data.date": -1 } };
    const pipeline = createPipeline(req.params.slug, matchStage, sortStage);

    const result = await DailySupply.aggregate(pipeline);
    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    // Handle the case where length is -1 (fetch all records)
    const limit = length === '-1' ? totalRecords : parseInt(length, 10);

    // Apply pagination
    const paginatedData = data.slice(parseInt(start), parseInt(start) + limit);

    const flattenedData = flattenData(paginatedData, isArea);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
    });
  } catch (error) {
    console.error("Error fetching supplier data:", error);
    res.status(500).render("partials/500", { layout: false });
  }

  function createMatchStage(slug, dateFilter, searchValue) {
    return {
      $match: {
        slug,
        ...dateFilter,
        ...(searchValue && {
          $or: [
            { "supplier.name": { $regex: searchValue, $options: "i" } },
            { "supplier.code": { $regex: searchValue, $options: "i" } },
          ],
        }),
      },
    };
  }

  function createPipeline(slug, matchStage, sortStage) {
    return [
      { $match: { slug } },
      { $unwind: "$data" },
      {
        $lookup: {
          from: "suppliers",
          localField: "data.supplier",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },
      matchStage,
      sortStage,
      {
        $facet: {
          data: [],
          totalRecords: [{ $count: "count" }],
        },
      },
    ];
  }

  function flattenData(data, isArea) {
    return data.map((item, index) => {
      const rawMaterials = item.data.rawMaterial.reduce((acc, raw) => {
        acc[raw.name] = {
          quantity: raw.quantity || "",
          percentage: raw.percentage || "",
        };
        return acc;
      }, {});

      const muNuocQuantity = rawMaterials["Mủ nước"]?.quantity || 0;
      const muNuocPercentage = rawMaterials["Mủ nước"]?.percentage || 0;
      const muNuocQuantityTotal = Number(
        ((muNuocQuantity * muNuocPercentage) / 100).toFixed(5)
      );
      return {
        no: index + 1,
        date: new Date(item.data.date).toLocaleDateString("vi-VN"),
        supplier: item.supplier.name || "",
        ...(isArea && { code: item.supplier.code || "" }),
        muNuocQuantity: muNuocQuantity.toLocaleString("vi-VN") || "",
        muNuocPercentage: muNuocPercentage.toLocaleString("vi-VN") || "",
        muNuocQuantityTotal: muNuocQuantityTotal.toLocaleString("vi-VN") || "",
        muTapQuantity:
          rawMaterials["Mủ tạp"]?.quantity?.toLocaleString("vi-VN") || "",
        muKeQuantity:
          rawMaterials["Mủ ké"]?.quantity?.toLocaleString("vi-VN") || "",
        muDongQuantity:
          rawMaterials["Mủ đông"]?.quantity?.toLocaleString("vi-VN") || "",
        note: item.data.note || "",
        id: item.data._id,
      };
    });
  }
}

async function getSupplierExportData(req, res, isArea) {
  try {
    const { draw, search, startDate, endDate, order } = req.body;
    const searchValue = search?.value?.toLowerCase() || "";

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);
    const matchStage = createMatchStage(
      req.params.slug,
      dateFilter,
      searchValue
    );

    const pipeline = createPipeline(req.params.slug, matchStage);

    const result = await DailySupply.aggregate(pipeline);
    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    // Sort the data by supplier name as it is in the database
    data.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));

    const flattenedData = flattenData(data, isArea);
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
    });
  } catch (error) {
    console.error("Error fetching supplier data:", error);
    res.status(500).render("partials/500", { layout: false });
  }

  function createMatchStage(slug, dateFilter, searchValue) {
    return {
      $match: {
        slug,
        ...dateFilter,
        ...(searchValue && {
          $or: [
            { "supplier.name": { $regex: searchValue, $options: "i" } },
            { "supplier.code": { $regex: searchValue, $options: "i" } },
          ],
        }),
      },
    };
  }

  function createPipeline(slug, matchStage) {
    return [
      { $match: { slug } },
      { $unwind: "$data" },
      {
        $lookup: {
          from: "suppliers",
          localField: "data.supplier",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },
      {
        $lookup: {
          from: "debts",
          localField: "supplier.debtHistory",
          foreignField: "_id",
          as: "supplier.debtHistory",
        },
      },
      {
        $lookup: {
          from: "moneyretaineds",
          localField: "supplier.moneyRetainedHistory",
          foreignField: "_id",
          as: "supplier.moneyRetainedHistory",
        },
      },
      matchStage,
      {
        $group: {
          _id: "$supplier._id",
          supplier: { $first: "$supplier" },
          rawMaterials: {
            $push: "$data.rawMaterial",
          },
          notes: { $push: "$data.note" },
        },
      },
      {
        $facet: {
          data: [],
          totalRecords: [{ $count: "count" }],
        },
      },
    ];
  }

  function calculateTotalDebtPaidAmount(debtHistory) {
    return debtHistory.reduce(
      (total, debt) => total + (debt.debtPaidAmount || 0),
      0
    );
  }

  function getTotalRetainedAmount(moneyRetainedHistory) {
    return moneyRetainedHistory.reduce(
      (total, retained) => total + (retained.retainedAmount || 0),
      0
    );
  }

  function calculateRemainingDebt(initialDebtAmount, totalDebtPaidAmount) {
    return initialDebtAmount - totalDebtPaidAmount;
  }

  function flattenData(data, isArea) {
    const calculateMaterialData = rawMaterials => {
      return rawMaterials.reduce((acc, rawMaterialArray) => {
        rawMaterialArray.forEach(raw => {
          const { name, quantity, ratioSplit, price, percentage } = raw;
          if (!acc[name]) {
            acc[name] = {
              quantity: 0,
              ratioSplit: 0,
              count: 0,
              price: 0,
              total: 0,
              afterSplit: 0,
              rawMaterial: [],
            };
          }
          if (name === 'Mủ nước') {
            acc[name].quantity += (quantity * percentage / 100) ;
            acc[name].afterSplit += (quantity * percentage / 100 * ratioSplit / 100);
            acc[name].total += (quantity * percentage / 100 * ratioSplit / 100) * price;
          } else {
            acc[name].quantity += quantity  ;
            acc[name].afterSplit += (quantity * (ratioSplit) / 100);
            acc[name].total += ((quantity * (ratioSplit)) / 100) * price;
          }
          acc[name].ratioSplit += ratioSplit;
          acc[name].count += 1; 
          acc[name].rawMaterial.push(raw);
  
  
          if (price) {
            acc[name].price += price;
          }
        });
        return acc;
      }, {});
    };
  
    return data.map((item, index) => {
      const rawMaterials = calculateMaterialData(item.rawMaterials);
  
      const no = index + 1;
      const {
        name: supplier = '',
        code: supplierCode = '',
        purchasedAreaDimension,
        purchasedAreaPrice,
        areaDeposit,
        debtHistory,
        initialDebtAmount,
        moneyRetainedHistory,
        ratioSumSplit
      } = item.supplier;
      const code = isArea ? supplierCode : undefined;
      const muQuyKhoData = rawMaterials['Mủ nước'] || {};
      const muTapData = rawMaterials['Mủ tạp'] || {};
      const muKeData = rawMaterials['Mủ ké'] || {};
      const muDongData = rawMaterials['Mủ đông'] || {};
      
      console.log(muQuyKhoData)
      const totalSum = ((muQuyKhoData.total || 0) + (muTapData.total || 0) + (muKeData.total || 0) + (muDongData.total || 0)) * parseFloat(ratioSumSplit) / 100;

      const note = item.notes.filter(Boolean).join(', ');
      const signature = '';
  
      // Calculate totalDebtPaidAmount and remainingDebt, retainedAmount
      const totalDebtPaidAmount = calculateTotalDebtPaidAmount(debtHistory);
      const remainingDebt = calculateRemainingDebt(initialDebtAmount, totalDebtPaidAmount);
      const retainedAmount = getTotalRetainedAmount(moneyRetainedHistory);
  
      return {
        no,
        supplier,
        ...(isArea && { code }),
        areaPurchased: purchasedAreaDimension,
        areaPrice: formatNumber(purchasedAreaPrice),
        areaTotal: formatNumber(purchasedAreaDimension * purchasedAreaPrice, 2),
        areaDeposit: formatNumber(areaDeposit),
        debtPaidAmount: formatNumber(totalDebtPaidAmount),
        remainingDebt: formatNumber(remainingDebt > 0 ? remainingDebt : 0),
        retainedAmount: formatNumber(retainedAmount > 0 ? retainedAmount : 0),
        // Mu nuoc
        muQuyKhoQuantity: formatNumber(muQuyKhoData.quantity || 0),
        muQuyKhoSplit: formatNumber(muQuyKhoData.count > 0 ? muQuyKhoData.ratioSplit / muQuyKhoData.count : 0),
        muQuyKhoQuantityAfterSplit: formatNumber(muQuyKhoData.afterSplit || 0),
        muQuyKhoDonGia: formatNumber(muQuyKhoData.price || 0),
        muQuyKhoTotal: formatNumber(muQuyKhoData.total || 0),
        // Mu tap
        muTapQuantity: formatNumber(muTapData.quantity || 0),
        muTapSplit: formatNumber(muTapData.count > 0 ? muTapData.ratioSplit / muTapData.count : 0),
        muTapAfterSplit: formatNumber(muTapData.afterSplit || 0),
        muTapDonGia: formatNumber(muTapData.price || 0),
        muTapTotal: formatNumber(muTapData.total || 0),
        // Mu ke
        muKeQuantity: formatNumber(muKeData.quantity || 0),
        muKeSplit: formatNumber(muKeData.count > 0 ? muKeData.ratioSplit / muKeData.count : 0),
        muKeAfterSplit: formatNumber(muKeData.afterSplit || 0),
        muKeDonGia: formatNumber(muKeData.price || 0),
        muKeTotal: formatNumber(muKeData.total || 0),
        // Mu dong
        muDongQuantity: formatNumber(muDongData.quantity || 0),
        muDongSplit: formatNumber(muDongData.count > 0 ? muDongData.ratioSplit / muDongData.count : 0),
        muDongAfterSplit: formatNumber(muDongData.afterSplit || 0),
        muDongDonGia: formatNumber(muDongData.price || 0),
        muDongTotal: formatNumber(muDongData.total || 0),
        totalSum: formatNumber(totalSum),
        note,
        signature,
      };
    });
  }
}

async function getIndividualSupplierExportData(req, res, sendResponse = true) {
  const { slug, supplierSlug } = req.params;
  const { draw, startDate, endDate, order } = sendResponse ? req.body : req.query;

  try {
    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);

    const supplier = await Supplier.findOne({ supplierSlug });
    if (!supplier) {
      if (sendResponse) {
        return res.status(404).json({ error: "Supplier not found" });
      } else {
        throw new Error("Supplier not found");
      }
    }

    const sortOrder = order && order[0] && order[0].dir === "desc" ? -1 : 1;

    const pipeline = [
      { $match: { slug: slug } },
      { $unwind: "$data" },
      {
        $match: {
          "data.supplier": supplier._id,
          ...dateFilter,
        },
      },
      { $sort: { "data.date": sortOrder } },
      {
        $facet: {
          totalRecords: [{ $count: "count" }],
          data: [
            {
              $project: {
                _id: "$data._id",
                date: "$data.date",
                rawMaterial: "$data.rawMaterial",
                note: "$data.note",
                supplierId: "$data.supplier",
              },
            },
          ],
        },
      },
    ];

    const result = await DailySupply.aggregate(pipeline);

    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    // Sort the data by date range
    data.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 1 ? dateA - dateB : dateB - dateA;
    });

    const { data: flattenedData, latestPrices } = flattenData(data);

    const response = {
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
      latestPrices: latestPrices,
    };

    if (sendResponse) {
      res.json(response);
    } else {
      return response;
    }
  } catch (error) {
    if (sendResponse) {
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    } else {
      throw new Error(`Internal Server Error: ${error.message}`);
    }
  }

  function flattenData(data) {
    let latestPrices = {
      muNuoc: 0,
      muTap: 0,
      muKe: 0,
      muDong: 0,
    };

    const flattenedData = data.map((item, index) => {
      const rawMaterials = item.rawMaterial.reduce((acc, raw) => {
        acc[raw.name] = {
          quantity: raw.quantity || 0,
          percentage: raw.percentage || 0,
          price: raw.price || 0,
          ratioSplit: raw.ratioSplit || 100,
        };
        return acc;
      }, {});

      // Update latest prices
      if (rawMaterials["Mủ nước"]?.price > 0)
        latestPrices.muNuoc = rawMaterials["Mủ nước"].price;
      if (rawMaterials["Mủ tạp"]?.price > 0)
        latestPrices.muTap = rawMaterials["Mủ tạp"].price;
      if (rawMaterials["Mủ ké"]?.price > 0)
        latestPrices.muKe = rawMaterials["Mủ ké"].price;
      if (rawMaterials["Mủ đông"]?.price > 0)
        latestPrices.muDong = rawMaterials["Mủ đông"].price;

      const muNuoc = rawMaterials["Mủ nước"] || {
        quantity: 0,
        percentage: 0,
        ratioSplit: 100,
        price: 0,
      };
      const muDong = rawMaterials["Mủ đông"] || {
        quantity: 0,
        ratioSplit: 100,
        price: 0,
      };
      const muTap = rawMaterials["Mủ tạp"] || {
        quantity: 0,
        ratioSplit: 100,
        price: 0,
      };
      const muKe = rawMaterials["Mủ ké"] || {
        quantity: 0,
        ratioSplit: 100,
        price: 0,
      };

      const muQuyKhoTotal = (muNuoc.quantity * muNuoc.percentage) / 100;
      const muQuyKhoTotalAfterSplit = (muQuyKhoTotal * muNuoc.ratioSplit) / 100;
      const muTapTotalAfterSplit = (muTap.quantity * muTap.ratioSplit) / 100;
      const muKeTotalAfterSplit = (muKe.quantity * muKe.ratioSplit) / 100;
      const muDongTotalAfterSplit = (muDong.quantity * muDong.ratioSplit) / 100;

      const muQuyKhoTotalPrice = muQuyKhoTotalAfterSplit * muNuoc.price;
      const muTapTotalPrice = muTapTotalAfterSplit * muTap.price;
      const muKeTotalPrice = muKeTotalAfterSplit * muKe.price;
      const muDongTotalPrice = muDongTotalAfterSplit * muDong.price;
      const totalPrice =
        muQuyKhoTotalPrice +
        muTapTotalPrice +
        muKeTotalPrice +
        muDongTotalPrice;

      return {
        no: index + 1,
        date: item.date.toLocaleDateString("vi-VN"),

        muNuocQuantity: formatNumber(muNuoc.quantity),
        muHamLuong: formatNumber(muNuoc.percentage),
        muQuyKhoTotal: formatNumber(muQuyKhoTotal),
        muQuyKhoPrice: formatNumber(muNuoc.price),
        muNuocRatioSplit: formatNumber(muNuoc.ratioSplit),
        muQuyKhoTotalAfterSplit: formatNumber(muQuyKhoTotalAfterSplit),
        muQuyKhoTotalPrice: formatNumber(muQuyKhoTotalPrice),

        muTapQuantity: formatNumber(muTap.quantity),
        muTapPrice: formatNumber(muTap.price),
        muTapRatioSplit: formatNumber(muTap.ratioSplit),
        muTapTotalAfterSplit: formatNumber(muTapTotalAfterSplit),
        muTapTotalPrice: formatNumber(muTapTotalPrice),

        muKeQuantity: formatNumber(muKe.quantity),
        muKePrice: formatNumber(muKe.price),
        muKeRatioSplit: formatNumber(muKe.ratioSplit),
        muKeTotalAfterSplit: formatNumber(muKeTotalAfterSplit),
        muKeTotalPrice: formatNumber(muKeTotalPrice),

        muDongQuantity: formatNumber(muDong.quantity),
        muDongPrice: formatNumber(muDong.price),
        muDongRatioSplit: formatNumber(muDong.ratioSplit),
        muDongTotalAfterSplit: formatNumber(muDongTotalAfterSplit),
        muDongTotalPrice: formatNumber(muDongTotalPrice),
        totalPrice: formatNumber(totalPrice),
        note: item.note || "",
        id: item._id,
      };
    });
    return {
      data: flattenedData,
      latestPrices: latestPrices,
    };
  }
}
