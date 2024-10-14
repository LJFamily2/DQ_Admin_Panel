const { DailySupply, Supplier } = require('../../models/dailySupplyModel');

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

// Get today date in UTC+7
function getTodayDate() {
  const today = new Date();
  today.setUTCHours(today.getUTCHours() + 7);
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
    'data.date': {
      $gte: new Date(startDateUTC),
      $lte: new Date(endDateUTC),
    },
  };
}

function parseDates(startDate, endDate) {
  const { effectiveStartDate, effectiveEndDate } = adjustDates(startDate, endDate);
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
    return { duration: null, status: 'No contract' }; 
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < today) {
    return { duration: Math.ceil((end - start) / (1000 * 60 * 60 * 24)), status: 'expired' };
  } else if (start <= today && end >= today) {
    return { duration: Math.ceil((end - today) / (1000 * 60 * 60 * 24)), status: 'valid' }; 
  }
  
  return { duration: null, status: 'No contract' }; 
}

async function getData(req, res) {
  try {
    const { draw, start, length, search, order, columns } = req.body;

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    // Define the filter object based on the search value
    const filter = searchValue
      ? { name: { $regex: searchValue, $options: 'i' } }
      : {};

    const sortObject = sortColumn ? { [sortColumn]: sortDirection } : {};

    // Count the total and filtered records
    const totalRecords = await DailySupply.countDocuments();
    const filteredRecords = await DailySupply.countDocuments(filter);

    const products = await DailySupply.find(filter)
      .sort(sortObject)
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .populate('accountID');

    // Map the products to the desired format
    const data = products.map((product, index) => {
      const { duration, status } = calculateContractDuration(product.contractDuration.start, product.contractDuration.end);
      return {
        no: parseInt(start, 10) + index + 1,
        area: product.name || '',
        accountID: product.accountID?.username || '',
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
    res.status(500).render('partials/500', { layout: false });
  }
}



async function getSupplierData(req, res) {
  await getSupplierInputData(req, res, false);
}

async function getAreaSupplierData(req, res) {
  await getSupplierInputData(req, res, true);
}

async function getSupplierInputData(req, res, isArea) {
  try {
    const { draw, search, startDate, endDate } = req.body;
    const searchValue = search?.value?.toLowerCase() || '';

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);
    const matchStage = createMatchStage(
      req.params.slug,
      dateFilter,
      searchValue,
    );
    const sortStage = { $sort: { 'data.date': -1 } };
    const pipeline = createPipeline(req.params.slug, matchStage, sortStage);

    const result = await DailySupply.aggregate(pipeline);
    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    const flattenedData = flattenData(data, isArea);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }

  function createMatchStage(slug, dateFilter, searchValue) {
    return {
      $match: {
        slug,
        ...dateFilter,
        ...(searchValue && {
          $or: [
            { 'supplier.name': { $regex: searchValue, $options: 'i' } },
            { 'supplier.code': { $regex: searchValue, $options: 'i' } },
          ],
        }),
      },
    };
  }

  function createPipeline(slug, matchStage, sortStage) {
    return [
      { $match: { slug } },
      { $unwind: '$data' },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'data.supplier',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: '$supplier' },
      matchStage,
      sortStage,
      {
        $facet: {
          data: [],
          totalRecords: [{ $count: 'count' }],
        },
      },
    ];
  }

  function flattenData(data, isArea) {
    return data.map((item, index) => {
      const rawMaterials = item.data.rawMaterial.reduce((acc, raw) => {
        acc[raw.name] = {
          quantity: raw.quantity || '',
          percentage: raw.percentage || '',
          ratioSplit: raw.ratioSplit || '',
        };
        return acc;
      }, {});

      return {
        no: index + 1,
        date: new Date(item.data.date).toLocaleDateString('vi-VN'),
        supplier: item.supplier.name || '',
        ...(isArea && { code: item.supplier.code || '' }),
        muNuocQuantity: rawMaterials['Mủ nước']?.quantity?.toLocaleString('vi-VN') || '',
        muNuocPercentage: rawMaterials['Mủ nước']?.percentage?.toLocaleString('vi-VN') || '',
        muNuocRatioSplit: rawMaterials['Mủ nước']?.ratioSplit?.toLocaleString('vi-VN') || '',
        muNuocQuantityToTal:Number((rawMaterials['Mủ nước'].quantity * rawMaterials['Mủ nước'].percentage / 100 * rawMaterials['Mủ nước'].ratioSplit / 100).toFixed(5)).toLocaleString('vi-VN') || '',
        muTapQuantity: rawMaterials['Mủ tạp']?.quantity?.toLocaleString('vi-VN') || '',
        muTapRatioSplit: rawMaterials['Mủ tạp']?.ratioSplit?.toLocaleString('vi-VN') || '',
        muTapQuantityToTal: Number((rawMaterials['Mủ tạp'].quantity * rawMaterials['Mủ tạp'].ratioSplit / 100).toFixed(5)).toLocaleString('vi-VN') || '',
        muKeQuantity: rawMaterials['Mủ ké']?.quantity?.toLocaleString('vi-VN') || '', 
        muKeRatioSplit: rawMaterials['Mủ ké']?.ratioSplit?.toLocaleString('vi-VN') || '',
        muKeQuantityToTal: Number((rawMaterials['Mủ ké'].quantity * rawMaterials['Mủ ké'].ratioSplit / 100).toFixed(5)).toLocaleString('vi-VN') || '',
        muDongQuantity: rawMaterials['Mủ đông']?.quantity?.toLocaleString('vi-VN') || '',
        muDongRatioSplit: rawMaterials['Mủ đông']?.ratioSplit?.toLocaleString('vi-VN') || '',
        muDongQuantityToTal: Number((rawMaterials['Mủ đông'].quantity * rawMaterials['Mủ đông'].ratioSplit / 100).toFixed(5)).toLocaleString('vi-VN') || '',
        note: item.data.note || '',
        id: item.data._id,
      };
    });
  }
}

async function getSupplierExportData(req, res, isArea) {
  try {
    const { draw, search, startDate, endDate } = req.body;
    const searchValue = search?.value?.toLowerCase() || '';

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);
    const matchStage = createMatchStage(
      req.params.slug,
      dateFilter,
      searchValue,
    );
    
    const pipeline = createPipeline(req.params.slug, matchStage);

    const result = await DailySupply.aggregate(pipeline);
    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    const flattenedData = flattenData(data, isArea);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }

  function createMatchStage(slug, dateFilter, searchValue) {
    return {
      $match: {
        slug,
        ...dateFilter,
        ...(searchValue && {
          $or: [
            { 'supplier.name': { $regex: searchValue, $options: 'i' } },
            { 'supplier.code': { $regex: searchValue, $options: 'i' } },
          ],
        }),
      },
    };
  }

  function createPipeline(slug, matchStage) {
    return [
      { $match: { slug } },
      { $unwind: '$data' },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'data.supplier',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: '$supplier' },
      matchStage,
      {
        $group: {
          _id: '$supplier._id',
          supplier: { $first: '$supplier' },
          rawMaterials: {
            $push: '$data.rawMaterial'
          },
          notes: { $push: '$data.note' }
        }
      },
      {
        $facet: {
          data: [],
          totalRecords: [{ $count: 'count' }],
        },
      },
    ];
  }

  function flattenData(data, isArea) {
    return data.map((item, index) => {
      const rawMaterials = item.rawMaterials.reduce((acc, rawMaterialArray) => {
        rawMaterialArray.forEach(raw => {
          if (!acc[raw.name]) {
            acc[raw.name] = { quantity: 0, price: 0, ratioSplit: 0, count: 0 };
          }
          acc[raw.name].quantity += raw.quantity || 0;
          acc[raw.name].ratioSplit += raw.ratioSplit || 0;
          if (raw.price) {
            acc[raw.name].price += raw.price;
            acc[raw.name].count++;
          }
        });
        return acc;
      }, {});

      Object.values(rawMaterials).forEach(material => {
        if (material.count > 0) {
          material.price = material.price / material.count; // Calculate average price
          material.ratioSplit /= material.count;
        }
      });

      const calculateTotal = (material) => {
        const { quantity, price, ratioSplit } = rawMaterials[material] || {};
        return (quantity * price * ratioSplit) / 100;
      };

      const formatNumber = (num) => num > 0 ? num.toLocaleString('vi-VN') : '';

      const totalSum = Object.keys(rawMaterials).reduce((sum, material) => {
        return sum + calculateTotal(material);
      }, 0);

      return {
        no: index + 1,
        supplier: item.supplier.name || '',
        ...(isArea && { code: item.supplier.code || '' }),
        muQuyKhoQuantity: formatNumber(rawMaterials['Mủ nước']?.quantity),
        muQuyKhoDonGia: formatNumber(rawMaterials['Mủ nước']?.price),
        muQuyKhoToTal: formatNumber(calculateTotal('Mủ nước')),
        muTapQuantity: formatNumber(rawMaterials['Mủ tạp']?.quantity * rawMaterials['Mủ tạp']?.ratioSplit / 100),
        muTapDonGia: formatNumber(rawMaterials['Mủ tạp']?.price),
        muTapTotal: formatNumber(calculateTotal('Mủ tạp')),
        muKeQuantity: formatNumber(rawMaterials['Mủ ké']?.quantity * rawMaterials['Mủ ké']?.ratioSplit / 100),
        muKeDonGia: formatNumber(rawMaterials['Mủ ké']?.price),
        muKeTotal: formatNumber(calculateTotal('Mủ ké')),
        muDongQuantity: formatNumber(rawMaterials['Mủ đông']?.quantity * rawMaterials['Mủ đông']?.ratioSplit / 100),
        muDongDonGia: formatNumber(rawMaterials['Mủ đông']?.price),
        muDongTotal: formatNumber(calculateTotal('Mủ đông')),
        totalSum: formatNumber(totalSum),
        note: item.notes.filter(Boolean).join(', '),
        signature: '',
        id: item.supplier.supplierSlug,
      };
    });
  }
}

async function getIndividualSupplierExportData(req, res) {
  try {
    const { slug, supplierSlug } = req.params;
    const { draw, startDate, endDate, order } = req.body;

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);

    const supplier = await Supplier.findOne({ supplierSlug });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const sortOrder = order && order[0] && order[0].dir === 'desc' ? -1 : 1;

    const pipeline = [
      { $match: { slug: slug } },
      { $unwind: '$data' },
      {
        $match: {
          'data.supplier': supplier._id,
          ...dateFilter,
        },
      },
      { $sort: { 'data.date': sortOrder } },
      {
        $facet: {
          totalRecords: [{ $count: 'count' }],
          data: [
            {
              $project: {
                _id: '$data._id', 
                date: '$data.date',
                rawMaterial: '$data.rawMaterial',
                note: '$data.note',
                supplierId: '$data.supplier',
              }
            }
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
    res.json({
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
      latestPrices: latestPrices
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }

  function flattenData(data) {
    let latestPrices = {
      muNuoc: 0,
      muTap: 0,
      muKe: 0,
      muDong: 0
    };

    const flattenedData = data.map((item, index) => {
      const rawMaterials = item.rawMaterial.reduce((acc, raw) => {
        acc[raw.name] = {
          quantity: raw.quantity || 0,
          percentage: raw.percentage || 0,
          price: raw.price || 0,
        };
        return acc;
      }, {});

      // Update latest prices
      if (rawMaterials['Mủ nước']?.price > 0) latestPrices.muNuoc = rawMaterials['Mủ nước'].price;
      if (rawMaterials['Mủ tạp']?.price > 0) latestPrices.muTap = rawMaterials['Mủ tạp'].price;
      if (rawMaterials['Mủ ké']?.price > 0) latestPrices.muKe = rawMaterials['Mủ ké'].price;
      if (rawMaterials['Mủ đông']?.price > 0) latestPrices.muDong = rawMaterials['Mủ đông'].price;

      const muNuoc = rawMaterials['Mủ nước'] || { quantity: 0, percentage: 0 };
      const muDong = rawMaterials['Mủ đông'] || { quantity: 0 };
      const muTap = rawMaterials['Mủ tạp'] || { quantity: 0 };
      const muKe = rawMaterials['Mủ ké'] || { quantity: 0 };

      const muQuyKhoTotal = (muNuoc.quantity * muNuoc.percentage) / 100;
      return {
        no: index + 1,
        date: item.date.toLocaleDateString('vi-VN'),
        muNuocQuantity: muNuoc.quantity.toLocaleString('vi-VN'),
        muHamLuong: muNuoc.percentage.toLocaleString('vi-VN'),
        muQuyKhoTotal: muQuyKhoTotal.toLocaleString('vi-VN'),
        muQuyKhoPrice: rawMaterials['Mủ nước']?.price.toLocaleString('vi-VN'),
        muTapQuantity: muTap.quantity.toLocaleString('vi-VN'),
        muTapPrice: rawMaterials['Mủ tạp']?.price.toLocaleString('vi-VN'),
        muKeQuantity: muKe.quantity.toLocaleString('vi-VN'),
        muKePrice: rawMaterials['Mủ ké']?.price.toLocaleString('vi-VN'),
        muDongQuantity: muDong.quantity.toLocaleString('vi-VN'),
        muDongPrice: rawMaterials['Mủ đông']?.price.toLocaleString('vi-VN'),
        note: item.note || '',
        id: item._id,  
      };
    });
    return {
      data: flattenedData,
      latestPrices: latestPrices
    };
  }
}