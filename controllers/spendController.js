const SpendModel = require('../models/spendModel');
const ProductTotalModel = require('../models/productTotalModel');
const formatTotalData = require('./utils/formatTotalData');
const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');
const convertToDecimal = require('./utils/convertToDecimal');

module.exports = {
  renderPage,
  createData,
  getData,
  updateData,
  deleteData,
  deleteAll,
};

async function updateProductTotal(amount, isCreating = true) {
  const updateData = {
    $inc: {
      spend: isCreating ? amount : -amount,
      profit: isCreating ? -amount : amount,
    },
  };
  await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });
}

async function renderPage(req, res) {
  try {
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);
    let spends = await SpendModel.find();
    res.render('src/spendPage', {
      layout: './layouts/defaultLayout',
      title: 'Quản lý chi tiêu',
      spends,
      total,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function createData(req, res) {
  req.body = trimStringFields(req.body);
  try {
    let checkExistedProduct = await SpendModel.findOne({
      date: req.body.date,
      product: { $regex: new RegExp(req.body.product, 'i') },
    });
    if (checkExistedProduct) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Sản phẩm đã tồn tại !',
        req.headers.referer,
      );
    }

    let quantity = convertToDecimal(req.body.quantity) || 1;
    let price = convertToDecimal(req.body.price) || 0;

    // Create spend document
    await SpendModel.create({
      ...req.body,
      quantity,
      price,
    });

    await updateProductTotal(quantity * price);

    // Success response
    return handleResponse(
      req,
      res,
      201,
      'success',
      'Tạo chi tiêu thành công !',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function getData(req, res) {
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
            { product: { $regex: searchValue, $options: 'i' } },
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

    const totalRecords = await SpendModel.countDocuments();
    const filteredRecords = await SpendModel.countDocuments(filter);
    const products = await SpendModel.find(filter)
      .sort(sortObject)
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10));

    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: product.date.toLocaleDateString('vi-VN'),
      product: product.product.toLocaleString('vi-VN') || '',
      quantity: product.product === 'lương' ? 0 : product.quantity.toLocaleString('vi-VN') || 0,
      price: product.product === 'lương' ? 0 : product.price.toLocaleString('vi-VN') || 0,
      total: (product.price * product.quantity).toLocaleString('vi-VN') || 0,
      notes: product.notes || '',
      id: product._id,
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

async function updateData(req, res) {
  try {
    const id = req.params.id;
    const product = await SpendModel.findById(id);
    if (!product) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy sản phẩm !',
        req.headers.referer,
      );
    }

    if (req.body.date && req.body.product) {
      const regexProduct = new RegExp(req.body.product, 'i');
      const checkExistedProduct = await SpendModel.findOne({
        _id: { $ne: id },
        date: req.body.date,
        product: { $regex: regexProduct },
      });

      if (checkExistedProduct) {
        return handleResponse(
          req,
          res,
          400,
          'fail',
          'Sản phẩm đã bị trùng lập vào cùng ngày!',
          req.headers.referer,
        );
      }
    }

    const updateFields = {
      ...req.body,
      quantity: convertToDecimal(req.body.quantity) || 1,
      price: convertToDecimal(req.body.price) || 0,
      notes: req.body.notes,
    };

    const newSpend = await SpendModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    const oldTotalPrice = product.price * product.quantity;
    const newTotalPrice = newSpend.price * newSpend.quantity;
    const diff = newTotalPrice - oldTotalPrice;

    if (diff !== 0) {
      const updateData = {
        $inc: {
          spend: diff,
          profit: -diff,
        },
      };
      await ProductTotalModel.findOneAndUpdate({}, updateData, { new: true });
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật thông tin chi tiêu thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteData(req, res) {
  try {
    const id = req.params.id;
    let product = await SpendModel.findByIdAndDelete(id);
    if (!product) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy sản phẩm !',
        req.headers.referer,
      );
    }

    await updateProductTotal(product.price * product.quantity, false);

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa thông tin chi tiêu thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteAll(req, res) {
  try {
    await SpendModel.deleteMany({});

    const productTotal = await ProductTotalModel.findOne({});
    const currentSpend = productTotal ? productTotal.spend : 0;

    await ProductTotalModel.findOneAndUpdate(
      {},
      {
        $set: { spend: 0 },
        $inc: { profit: currentSpend },
      },
    );

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả thông tin chi tiêu thành công!',
      req.headers.referer,
    );
  } catch (err) {
    res.status(500).render('partials/500', { layout: false });
  }
}
