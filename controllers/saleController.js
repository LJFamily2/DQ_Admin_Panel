const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');
const formatTotalData = require('./utils/formatTotalData');
const formatNumberForDisplay = require('./utils/formatNumberForDisplay');
const convertToDecimal = require('./utils/convertToDecimal')

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
    quantity: parseFloat(convertToDecimal(quantities[index])) || 0,
    price: parseFloat(convertToDecimal(prices[index])) || 0,
  }));

// Calculate differences
const calculateDifferences = (newProducts, oldSale) => {
  // Initialize accumulators for old sale totals
  let oldTotals = {
    product: 0,
    dryRubber: 0,
    mixedQuantity: 0,
    income: 0,
  };

  // Accumulate totals for old sale
  oldSale.products.forEach(product => {
    oldTotals[product.name] += product.quantity;
    oldTotals.income += product.quantity * product.price;
  });

  // Initialize accumulators for new sale totals
  let newTotals = {
    product: 0,
    dryRubber: 0,
    mixedQuantity: 0,
    income: 0,
  };

  // Accumulate totals for new sale
  newProducts.forEach(product => {
    newTotals[product.name] += product.quantity;
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
    res.status(500).render('partials/500');
  }
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
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

    let updateData = {
      $inc: {
        income: parseFloat(totals.totalIncome).toFixed(2),
        ...(totals.product > 0 && { product: -parseFloat(totals.product).toFixed(2) }),
        ...(totals.dryRubber > 0 && { dryRubber: -parseFloat(totals.dryRubber).toFixed(2) }),
        ...(totals.mixedQuantity > 0 && { mixedQuantity: -parseFloat(totals.mixedQuantity).toFixed(2) }),
      },
    };
    
    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, { new: true, upsert: true });
    
    if (!total) {
      return handleResponse(req, res, 500, 'fail', 'Cập nhật dữ liệu tổng thất bại', req.headers.referer);
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
  } catch {
    res.status(500).render('partials/500');
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
      if (startDate) {
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0, 0, 0, 0);
        filter.date.$gte = filterStartDate;
      }
      if (endDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999);
        filter.date.$lte = filterEndDate;
      }
    }

    const totalRecords = await SaleModel.countDocuments();
    const filteredRecords = await SaleModel.countDocuments(filter);
    const sales = await SaleModel.find(filter)
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))

      const data = sales.map((sale, index) => {
        // Assuming each sale has a 'products' array
        const totalPrice = sale.products.reduce((acc, product) => acc + (product.quantity * product.price), 0);
        return {
          no: parseInt(start, 10) + index + 1,
          date: sale.date.toLocaleDateString(),
          code: sale.code || '',
          products: parseInt(start, 10) + index + 1, 
          notes: sale.notes || '',
          total:formatNumberForDisplay(totalPrice)  + " VND",
          status: sale.status,
          slug: sale.slug,
        };
      });

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch  {
    res.status(500).render('partials/500');
  }
}

async function updateData(req, res) {
  req.body = trimStringFields(req.body);
  try{ 
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

  const names = ensureArray(req.body.name) || "";
  const quantities = ensureArray(req.body.quantity) || 0;
  const prices = ensureArray(req.body.price) || 0;
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
  
  let updateData = {
    $inc: {
      product: -parseFloat(parseFloat(totalProductDiff).toFixed(2)),
      income: parseFloat(parseFloat(totalIncomeDiff).toFixed(2)),
      dryRubber: -parseFloat(parseFloat(totalDryRubberDiff).toFixed(2)),
      mixedQuantity: -parseFloat(parseFloat(totalMixedQuantityDiff).toFixed(2)),
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
  }catch{
    res.status(500).render('partials/500');
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
      (acc, { name, quantity, price }) => {
        // Assuming quantity and price are already numbers
        const totalForProduct = quantity * price;
        acc[name] = (acc[name] || 0) + quantity;
        acc.totalIncome += totalForProduct;
        return acc;
      },
      { product: 0, dryRubber: 0, mixedQuantity: 0, totalIncome: 0 },
    );
    
    
    let updateData = {
      $inc: {
        income:  -parseFloat(totals.totalIncome.toFixed(2)),
        ...(totals.product > 0 && { product: parseFloat(totals.product.toFixed(2)) }),
        ...(totals.dryRubber > 0 && { dryRubber: parseFloat(totals.dryRubber.toFixed(2)) }),
        ...(totals.mixedQuantity > 0 && {
          mixedQuantity: parseFloat(totals.mixedQuantity.toFixed(2)),
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
  } catch  {
    res.status(500).render('partials/500');
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
      user:req.user,
      total,
      messages: req.flash(),
      title: 'Chi tiết hợp đồng bán mủ',
    });
  } catch  {
    res.status(500).render('partials/500');
  }
}
