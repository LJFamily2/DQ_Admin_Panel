const ProductTotalModel = require('../models/productTotalModel');
const AccountModel = require('../models/accountModel');
const { Supplier, DailySupply } = require('../models/dailySupplyModel');

const formatTotalData = require('./utils/formatTotalData');
const handleResponse = require('./utils/handleResponse');

module.exports = {
  renderPage,
  renderDetailPage,
  addData,
  getData,
};

const ensureArray = input => (Array.isArray(input) ? input : [input]);

async function renderPage(req, res) {
  try {
    const areas = await DailySupply.find({}).populate('accountID')
    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);
    res.render('src/dailySupplyPage', {
      layout: './layouts/defaultLayout',
      title: 'Dữ liệu mủ hằng ngày',
      hamLuongAccounts,
      areas,
      total,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function renderDetailPage(req, res) {
  try {
    const area = await DailySupply.findOne({slug: req.params.slug}).populate('accountID').populate('suppliers')
    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);
    res.render('src/dailySupplyDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Dữ liệu mủ hằng ngày của ${area.name}`,
      hamLuongAccounts,
      area,
      total,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function addData(req, res) {
  console.log(req.body);
  try {
    const supplierNames = ensureArray(req.body.supplierName);
    const codes = ensureArray(req.body.code);

    const suppliers = supplierNames.map((name, index) => ({
      name: name || '',
      code: codes[index] || '',
    }));

    const createdSuppliers = await Supplier.create(suppliers);

    const suppliersId = createdSuppliers.map(supplier => supplier._id);

    await DailySupply.create({...req.body,name: req.body.areaName, suppliers:suppliersId })

    handleResponse(req,res, 201, 'success', 'Tạo khu vực thành công', req.headers.referer )

  } catch (error) {
    console.log(error);
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
    } = req.body;

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    // Define the filter object based on the search value
    const filter = searchValue
      ? { name: { $regex: searchValue, $options: 'i' } }
      : {};

    const sortObject = sortColumn
      ? { [sortColumn]: sortDirection }
      : {};

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
      accountID: product.accountID.username || '',
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