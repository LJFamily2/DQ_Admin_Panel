const { DailySupply, Supplier } = require('../../models/dailySupplyModel');

// Add these helper functions at the top of the file, outside of any other functions

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; 
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
  startDateUTC.setHours(0, 0, 0, 0);
  const endDateUTC = new Date(effectiveEndDate);
  endDateUTC.setHours(23, 59, 59, 999);
  return { startDateUTC, endDateUTC };
}

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
    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      area: product.name || '',
      accountID: product.accountID?.username || '',
      link: {
        _id: product._id,
        slug: product.slug,
      },
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.log(err);
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
        muNuocQuantityToTal:
          rawMaterials['Mủ nước']?.quantity && rawMaterials['Mủ nước']?.percentage
            ? Number(((rawMaterials['Mủ nước'].quantity * rawMaterials['Mủ nước'].percentage) / 100).toFixed(5))
            : '',
        muTapQuantity: rawMaterials['Mủ tạp']?.quantity?.toLocaleString('vi-VN') || '',
        muKeQuantity: rawMaterials['Mủ ké']?.quantity?.toLocaleString('vi-VN') || '',
        muDongQuantity: rawMaterials['Mủ đông']?.quantity?.toLocaleString('vi-VN') || '',
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
          quantity: raw.quantity,
          percentage: raw.percentage,
          price: raw.price,
        };
        return acc;
      }, {});

      const muQuyKhoQuantity =
        (rawMaterials['Mủ nước']?.quantity *
          rawMaterials['Mủ nước']?.percentage) /
        100;
      const muQuyKhoPrice = rawMaterials['Mủ nước']?.price;
      const muQuyKhoToTal = rawMaterials['Mủ nước']?.price * muQuyKhoQuantity;
      const muTapTotal =
        rawMaterials['Mủ tạp']?.quantity * rawMaterials['Mủ tạp']?.price;

      const muKeQuantity = rawMaterials['Mủ ké']?.quantity;
      const muKeDonGia = rawMaterials['Mủ ké']?.price;
      const muKeTotal = muKeQuantity * muKeDonGia;

      const muDongQuantity = rawMaterials['Mủ đông']?.quantity;
      const muDongDonGia = rawMaterials['Mủ đông']?.price;
      const muDongTotal = muDongQuantity * muDongDonGia;

      return {
        no: index + 1,
        date: new Date(item.data.date).toLocaleDateString('vi-VN'),
        supplier: item.supplier.name || '',
        ...(isArea && { code: item.supplier.code || '' }),
        muQuyKhoQuantity: muQuyKhoQuantity > 0 ? muQuyKhoQuantity.toLocaleString('vi-VN') : '',
        muQuyKhoDonGia: muQuyKhoPrice > 0 ? muQuyKhoPrice.toLocaleString('vi-VN') : '',
        muQuyKhoToTal: muQuyKhoToTal > 0 ? muQuyKhoToTal.toLocaleString('vi-VN') : '',
        muTapQuantity: rawMaterials['Mủ tạp']?.quantity > 0 ? rawMaterials['Mủ tạp'].quantity.toLocaleString('vi-VN') : '',
        muTapDonGia: rawMaterials['Mủ tạp']?.price > 0 ? rawMaterials['Mủ tạp'].price.toLocaleString('vi-VN') : '',
        muTapTotal: muTapTotal > 0 ? muTapTotal.toLocaleString('vi-VN') : '',
        muKeQuantity: muKeQuantity > 0 ? muKeQuantity.toLocaleString('vi-VN') : '',
        muKeDonGia: muKeDonGia > 0 ? muKeDonGia.toLocaleString('vi-VN') : '',
        muKeTotal: muKeTotal > 0 ? muKeTotal.toLocaleString('vi-VN') : '',
        muDongQuantity: muDongQuantity > 0 ? muDongQuantity.toLocaleString('vi-VN') : '',
        muDongDonGia: muDongDonGia > 0 ? muDongDonGia.toLocaleString('vi-VN') : '',
        muDongTotal: muDongTotal > 0 ? muDongTotal.toLocaleString('vi-VN') : '',
        id: item.data._id,
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

    const sortOrder = order && order[0] ? (order[0].dir === 'desc' ? -1 : 1) : -1;

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
    console.log(flattenedData)
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
        muDongQuantity: muDong.quantity.toLocaleString('vi-VN'),
        muDongPrice: rawMaterials['Mủ đông']?.price.toLocaleString('vi-VN'),
        id: item._id,  
      };
    });

    return {
      data: flattenedData,
      latestPrices: latestPrices
    };
  }
}