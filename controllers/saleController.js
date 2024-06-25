const SaleModel = require('../models/saleModel');
const ProductTotalModel = require('../models/productTotalModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');

module.exports = {
  renderPage,
  createData,
  getDatas,
  updateData,
};

async function renderPage(req, res) {
  try {
    const sales = await SaleModel.find();
    const total = await ProductTotalModel.find();
    res.render('src/salePage', {
      layout: './layouts/defaultLayout',
      sales,
      total,
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
  console.log(req.body)
  try {
    const products = (
      Array.isArray(req.body.name) ? req.body.name : [req.body.name]
    ).map((name, i) => ({
      name,
      quantity: parseFloat(
        (Array.isArray(req.body.quantity)
          ? req.body.quantity
          : [req.body.quantity])[i].replace(/,/g, '.'),
      ),
      price: parseFloat(
        (Array.isArray(req.body.price) ? req.body.price : [req.body.price])[
          i
        ].replace(/,/g, '.'),
      ),
    }));

    const newSale = await SaleModel.create({
      ...req.body,
      products,
      status: 'active',
    });

    let updateData = { $inc: {} };

    let totalQuantityUsed = 0;
    let totalIncome = 0;
    products.forEach(product => {
      totalQuantityUsed += product.quantity;
      totalIncome += product.quantity * product.price;
    });

    if (totalQuantityUsed > 0) {
      updateData.$inc.dryRubber = -totalQuantityUsed;
      updateData.$inc.income = totalIncome;
    }

    const total = await ProductTotalModel.updateOne({}, updateData, {
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
      id: product._id,
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
  console.log(req.body)
  req.body = trimStringFields(req.body)
  try {
     const {id} = req.params;
    console.log(id)
    // const updateField = {
    //   ...req.body,
    // };

  } catch (err) {
    console.log(err);
    res.status(500);
  }
}
