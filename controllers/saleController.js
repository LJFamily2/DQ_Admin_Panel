const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');
const formatTotalData = require('./utils/formatTotalData');
const convertToDecimal = require('./utils/convertToDecimal');

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
  deleteData,
  deleteAll,

  renderDetailPage,
};

const ensureArray = input => (Array.isArray(input) ? input : [input]);

// Helper to convert product data
const convertProductData = (
  names,
  quantities,
  prices,
  percentages,
  inputDates,
  createData,
) => {
  let dryRubberIndex = 0;

  return names.map((name, index) => {
    const productData = {
      name,
      quantity: convertToDecimal(quantities[index]) || 0,
      price: convertToDecimal(prices[index]) || 0,
      date: createData ? inputDates : inputDates[index],
    };

    if (name === 'dryRubber') {
      productData.percentage =
        convertToDecimal(percentages[dryRubberIndex]) || 0;
      dryRubberIndex++;
    }

    return productData;
  });
};

// Calculate differences
const calculateDifferences = (newProducts, oldSale) => {
  let oldTotals = {
    product: 0,
    dryRubber: 0,
    mixedQuantity: 0,
    income: 0,
  };

  oldSale.products.forEach(product => {
    if (product.name === 'dryRubber') {
      oldTotals.dryRubber += (product.quantity * product.percentage) / 100;
    } else {
      oldTotals[product.name] += product.quantity;
    }
    oldTotals.income += product.quantity * product.price;
  });

  let newTotals = {
    product: 0,
    dryRubber: 0,
    mixedQuantity: 0,
    income: 0,
  };

  // Accumulate totals for new sale
  newProducts.forEach(product => {
    if (product.name === 'dryRubber') {
      newTotals.dryRubber += (product.quantity * product.percentage) / 100;
    } else {
      newTotals[product.name] += product.quantity;
    }
    newTotals.income += product.quantity * product.price;
  });

  // Calculate differences
  let differences = {
    totalProductDiff: newTotals.product - oldTotals.product,
    totalDryRubberDiff: newTotals.dryRubber - oldTotals.dryRubber,
    totalMixedQuantityDiff: newTotals.mixedQuantity - oldTotals.mixedQuantity,
    totalIncomeDiff: newTotals.income - oldTotals.income,
  };

  return differences;
};

async function renderPage(req, res) {
  try {
    const sales = await SaleModel.find();

    let totalData = await ProductTotalModel.find({});
    const total = formatTotalData(totalData);
    res.render('src/salePage', {
      layout: './layouts/defaultLayout',
      sales,
      total,
      index: 0,
      user: req.user,
      messages: req.flash(),
      title: 'Quản lý hợp đồng bán mủ',
    });
  } catch {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function createData(req, res) {
  try {
    let checkExistedData = await SaleModel.findOne({
      code: { $regex: new RegExp(req.body.code, 'i') },
      date: req.body.date,
    });
    if (checkExistedData) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Hợp đồng đã tồn tại',
        req.headers.referer,
      );
    }

    const names = ensureArray(req.body.name);
    const quantities = ensureArray(req.body.quantity);
    const prices = ensureArray(req.body.price);
    const percentage = ensureArray(req.body.percentage);
    const inputDate = req.body.date;
    const products = convertProductData(
      names,
      quantities,
      prices,
      percentage,
      inputDate,
      true,
    );

    const newSale = await SaleModel.create({
      ...req.body,
      products,
      status: 'active',
    });

    // Calculate totals and prepare updateData in a single step
    const totals = products.reduce(
      (acc, { name, quantity, price, percentage }) => {
        if (name === 'dryRubber') {
          acc.dryRubber += (quantity * percentage) / 100;
        } else {
          acc[name] = (acc[name] || 0) + quantity;
        }
        acc.totalIncome += quantity * price;
        return acc;
      },
      { product: 0, dryRubber: 0, mixedQuantity: 0, totalIncome: 0 },
    );

    let updateData = {
      $inc: {
        income: totals.totalIncome,
        profit: totals.totalIncome,
        ...(totals.product > 0 && { product: -totals.product }),
        ...(totals.dryRubber > 0 && {
          dryRubber: -totals.dryRubber,
        }),
        ...(totals.mixedQuantity > 0 && {
          mixedQuantity: -totals.mixedQuantity,
        }),
      },
    };

    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    if (!total) {
      return handleResponse(
        req,
        res,
        500,
        'fail',
        'Cập nhật dữ liệu tổng thất bại',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      newSale ? 200 : 404,
      newSale ? 'success' : 'fail',
      newSale
        ? 'Thêm hợp đồng bán mủ thành công'
        : 'Thêm hợp đồng bán mủ thất bại',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
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

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const searchQuery = searchValue
      ? {
          $or: [
            { code: { $regex: searchValue, $options: 'i' } },
            { status: { $regex: searchValue, $options: 'i' } },
            { notes: { $regex: searchValue, $options: 'i' } },
          ],
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
    const isSortingByDate = sortColumn === 'date';

    const sortObject = isSortingByDate
      ? { [sortColumn]: sortDirection }
      : { date: -1 };

    const totalRecords = await SaleModel.countDocuments();
    const filteredRecords = await SaleModel.countDocuments(filter);
    const sales = await SaleModel.find(filter)
      .sort(sortObject)
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10));

    const data = sales.map((sale, index) => {
      // Assuming each sale has a 'products' array
      const totalPrice = sale.products.reduce(
        (acc, product) => acc + product.quantity * product.price,
        0,
      );
      return {
        no: parseInt(start, 10) + index + 1,
        date: sale.date.toLocaleDateString('vi-VN'),
        code: sale.code || '',
        products: sale._id,
        notes: sale.notes || '',
        total: totalPrice.toLocaleString('vi-VN'),
        status: sale.status,
        slug: { id: sale._id, slug: sale.slug },
      };
    });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updateData(req, res) {
  try {
    const { id } = req.params;
    if (!id)
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Không tìm thấy hàng hóa trong cơ sở dữ liệu',
        req.headers.referer,
      );

    const names = ensureArray(req.body.name);
    const quantities = ensureArray(req.body.quantity);
    const prices = ensureArray(req.body.price);
    const inputDates = ensureArray(req.body.inputDate);
    const percentages = ensureArray(req.body.percentage);
    const products = convertProductData(
      names,
      quantities,
      prices,
      percentages,
      inputDates,
    );

    let oldSale = await SaleModel.findById(id);

    const updateField = { ...req.body, products, notes: req.body.notes };

    await SaleModel.findByIdAndUpdate(id, updateField, {
      new: true,
    });

    let {
      totalProductDiff,
      totalIncomeDiff,
      totalDryRubberDiff,
      totalMixedQuantityDiff,
    } = calculateDifferences(products, oldSale);

    let updateData = {
      $inc: {
        product: -totalProductDiff,
        income: totalIncomeDiff,
        profit: totalIncomeDiff,
        dryRubber: -totalDryRubberDiff,
        mixedQuantity: -totalMixedQuantityDiff,
      },
    };

    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
    });
    if (!total)
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật dữ liệu tổng thất bại',
        req.headers.referer,
      );

    handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật hợp đồng thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteData(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Không tìm thấy hàng hóa trong cơ sở dữ liệu',
        req.headers.referer,
      );
    }

    const sale = await SaleModel.findByIdAndDelete(id);

    if (!sale) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Xóa hợp đồng thất bại!',
        req.headers.referer,
      );
    }

    const totals = sale.products.reduce(
      (acc, { name, quantity, price, percentage }) => {
        if (name === 'dryRubber') {
          acc.dryRubber += (quantity * percentage) / 100;
        } else {
          acc[name] = (acc[name] || 0) + quantity;
        }
        acc.totalIncome += quantity * price;
        return acc;
      },
      { product: 0, dryRubber: 0, mixedQuantity: 0, totalIncome: 0 },
    );

    let updateData = {
      $inc: {
        income: -totals.totalIncome,
        profit: -totals.totalIncome,
        ...(totals.product > 0 && { product: totals.product }),
        ...(totals.dryRubber > 0 && { dryRubber: totals.dryRubber }),
        ...(totals.mixedQuantity > 0 && {
          mixedQuantity: totals.mixedQuantity,
        }),
      },
    };

    await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
    });

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa hợp đồng thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function renderDetailPage(req, res) {
  try {
    const { slug } = req.params;
    const sale = await SaleModel.findOne({ slug });
    let totalData = await ProductTotalModel.find({});
    const total = formatTotalData(totalData);
    if (!sale) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy hợp đồng',
        '/quan-ly-hop-dong',
      );
    }
    res.render('src/saleDetailPage', {
      layout: './layouts/defaultLayout',
      sale,
      user: req.user,
      total,
      messages: req.flash(),
      title: 'Chi tiết hợp đồng bán mủ',
    });
  } catch {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteAll(req, res) {
  try {
    const sales = await SaleModel.find({});

    const { dryrubberQuantity, productQuantity, mixedQuantity } = sales.reduce(
      (acc, sale) => {
        sale.products.forEach(product => {
          switch (product.name) {
            case 'dryRubber':
              acc.dryrubberQuantity +=
                (product.quantity * product.percentage) / 100;
              break;
            case 'product':
              acc.productQuantity += product.quantity;
              break;
            case 'mixedQuantity':
              acc.mixedQuantity += product.quantity;
              break;
            default:
              break;
          }
        });
        return acc;
      },
      { dryrubberQuantity: 0, productQuantity: 0, mixedQuantity: 0 },
    );

    const productTotal = await ProductTotalModel.findOne({});
    const currentIncome = productTotal ? productTotal.income : 0;

    await ProductTotalModel.findOneAndUpdate(
      {},
      {
        $set: { income: 0 },
        $inc: {
          product: productQuantity,
          dryRubber: dryrubberQuantity,
          mixedQuantity: mixedQuantity,
          profit: -currentIncome,
        },
      },
      { new: true },
    );

    // Delete all sales
    await SaleModel.deleteMany({});

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả hợp đồng thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}
