const { DailySupply } = require('../../models/dailySupplyModel');

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

  function parseDates(startDate, endDate) {
    return {
      startDateUTC: startDate
        ? new Date(startDate).setUTCHours(0, 0, 0, 0)
        : null,
      endDateUTC: endDate
        ? new Date(endDate).setUTCHours(23, 59, 59, 999)
        : null,
    };
  }

  function createDateFilter(startDateUTC, endDateUTC) {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date().setUTCHours(23, 59, 59, 999);

    if (startDateUTC && !endDateUTC) {
      endDateUTC = startDateUTC;
    }

    return startDateUTC || endDateUTC
      ? {
          'data.date': {
            ...(startDateUTC && { $gte: new Date(startDateUTC) }),
            ...(endDateUTC && { $lte: new Date(endDateUTC) }),
          },
        }
      : {
          'data.date': { $gte: new Date(today), $lte: new Date(tomorrow) },
        };
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
          quantity: raw.quantity?.toLocaleString('vi-VN') || '',
          percentage: raw.percentage?.toLocaleString('vi-VN') || '',
        };
        return acc;
      }, {});

      return {
        no: index + 1,
        date: new Date(item.data.date).toLocaleDateString('vi-VN'),
        supplier: item.supplier.name || '',
        ...(isArea && { code: item.supplier.code || '' }),
        muNuocQuantityToTal:
          (rawMaterials['Mủ nước']?.quantity *
            rawMaterials['Mủ nước']?.percentage) /
            100 || '',
        muTapQuantity: rawMaterials['Mủ tạp']?.quantity || '',
        muKeDongQuantity: rawMaterials['Mủ đông']?.quantity + rawMaterials['Mủ Ké']?.quantity  || '',
        muDongPercentage: rawMaterials['Mủ đông']?.percentage || '',
        id: item.data._id,
      };
    });
  }
}

module.exports = {
  getData,

  // DetailPage
  getAreaSupplierData,

  // User side for input data
  getSupplierData,
};
