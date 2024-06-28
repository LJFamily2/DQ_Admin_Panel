const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');
const formatTotalData = require('./utils/formatTotalData');

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
  deleteData,

  renderDetailPage,
};

const ensureArray = input => (Array.isArray(input) ? input : [input]);

// Helper to convert product data
const convertProductData = (names, quantities, prices) =>
  names.map((name, index) => ({
    name,
    quantity: parseFloat(quantities[index].replace(/,/g, '.')) || 0,
    price: parseFloat(prices[index].replace(/,/g, '.')) || 0,
  }));

// Calculate differences
const calculateDifferences = (products, oldSale) => {
  return products.reduce(
    (acc, product) => {
      const oldProduct = oldSale.products.find(
        p => p.name === product.name,
      ) || { quantity: 0, price: 0 };

      // Calculate the quantity difference
      const quantityDiff = product.quantity - oldProduct.quantity;

      // Calculate the income difference
      acc.totalIncomeDiff +=
        product.quantity * product.price -
        oldProduct.quantity * oldProduct.price;

      switch (product.name) {
        case 'product':
          acc.totalProductDiff += quantityDiff;
          break;
        case 'dryRubber':
          acc.totalDryRubberDiff += quantityDiff;
          break;
        case 'mixedQuantity':
          acc.totalMixedQuantityDiff += quantityDiff;
          break;
        default:
          break;
      }

      return acc;
    },
    {
      totalProductDiff: 0,
      totalIncomeDiff: 0,
      totalDryRubberDiff: 0,
      totalMixedQuantityDiff: 0,
    },
  );
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
      messages: req.flash(),
      title: 'Quản lý hợp đồng bán mủ',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  console.log(req.body);
  try {
    const names = ensureArray(req.body.name);
    const quantities = ensureArray(req.body.quantity);
    const prices = ensureArray(req.body.price);
    const products = convertProductData(names, quantities, prices);

    const newSale = await SaleModel.create({
      ...req.body,
      products,
      status: 'active',
    });

    // Calculate totals and prepare updateData in a single step
    const totals = products.reduce(
      (acc, { name, quantity, price }) => {
        acc[name] = (acc[name] || 0) + quantity;
        acc.totalIncome += quantity * price;
        return acc;
      },
      { product: 0, dryRubber: 0, mixedQuantity: 0, totalIncome: 0 },
    );

    console.log(totals.totalIncome);
    console.log(totals.product);
    console.log(totals.dryRubber);
    console.log(totals.mixedQuantity);

    let updateData = {
      $inc: {
        income: totals.totalIncome,
        ...(totals.product > 0 && { product: -totals.product }),
        ...(totals.dryRubber > 0 && { dryRubber: -totals.dryRubber }),
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
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
}

async function getDatas(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    // Use these ObjectId(s) in your searchQuery
    const searchQuery = searchValue
      ? {
          $or: [
            { date: { $regex: searchValue, $options: 'i' } },
            { code: { $regex: searchValue, $options: 'i' } },
            { status: { $regex: searchValue, $options: 'i' } },
            { notes: { $regex: searchValue, $options: 'i' } },
          ],
        }
      : {};

    const totalRecords = await SaleModel.countDocuments();
    const filteredRecords = await SaleModel.countDocuments(searchQuery);
    const products = await SaleModel.find(searchQuery)
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: product.date.toLocaleDateString(),
      code: product.code || '',
      products: '',
      notes: product.notes || '',
      total: product.quantity * product.price || 0,
      status: product.status,
      slug: product.slug,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (error) {
    console.error('Error handling DataTable request:', error);
    res.status(500);
  }
}

async function updateData(req, res) {
  console.log(req.body);
  req.body = trimStringFields(req.body);
  const { id } = req.params;
  console.log(id);
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
  const products = convertProductData(names, quantities, prices);

  let oldSale = await SaleModel.findById(id);
  if (!oldSale)
    return handleResponse(
      req,
      res,
      404,
      'fail',
      'Không tìm thấy hợp đồng',
      req.headers.referer,
    );

  // Identify and set removed fields to undefined
  const updateField = { ...req.body, products };

  Object.keys(oldSale.toObject()).forEach(key => {
    if (!req.body.hasOwnProperty(key) && key !== '_id' && key !== 'products') {
      updateField[key] = undefined;
    }
  });

  const newSale = await SaleModel.findByIdAndUpdate(id, updateField, {
    new: true,
  });
  if (!newSale)
    return handleResponse(
      req,
      res,
      404,
      'fail',
      'Cập nhật hợp đồng thất bại!',
      req.headers.referer,
    );

  let {
    totalProductDiff,
    totalIncomeDiff,
    totalDryRubberDiff,
    totalMixedQuantityDiff,
  } = calculateDifferences(products, oldSale);

  // Handle products that were removed
  oldSale.products.forEach(oldProduct => {
    if (!products.find(product => product.name === oldProduct.name)) {
      totalProductDiff -= oldProduct.quantity;
      totalIncomeDiff -= oldProduct.quantity * oldProduct.price;
    }
  });

  console.log(
    totalProductDiff,
    totalIncomeDiff,
    totalDryRubberDiff,
    totalMixedQuantityDiff,
  );

  let updateData = {
    $inc: {
      product: -totalProductDiff || 0,
      income: totalIncomeDiff || 0,
      dryRubber: -totalDryRubberDiff || 0,
      mixedQuantity: -totalMixedQuantityDiff || 0,
    },
  };

  console.log(updateData);

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

    let updateData = { $inc: {} };
    let totalIncome = 0;
    let totalProduct = 0;

    sale.products.forEach(product => {
      totalIncome += product.price * product.quantity;
      totalProduct += product.quantity;
    });

    updateData = { $inc: { income: -totalIncome, product: totalProduct } };

    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật dữ liệu tổng thất bại',
        req.headers.referer,
      );
    }

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa hợp đồng thành công!',
      req.headers.referer,
    );
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function renderDetailPage(req, res) {
  try {
    const { slug } = req.params;
    const sale = await SaleModel.findOne({ slug });
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
      messages: req.flash(),
      title: 'Chi tiết hợp đồng bán mủ',
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}
