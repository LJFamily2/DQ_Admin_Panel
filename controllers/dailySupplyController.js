const ProductTotalModel = require('../models/productTotalModel');
const AccountModel = require('../models/accountModel');
const { Supplier, DailySupply } = require('../models/dailySupplyModel');

const trimStringFields = require('./utils/trimStringFields');
const formatTotalData = require('./utils/formatTotalData');
const handleResponse = require('./utils/handleResponse');

module.exports = {
  renderPage,
  renderDetailPage,
  addArea,
  deleteArea,
  getData,
  updateArea,
  addSupplier,
  deleteSupplier,
  editSupplier,
};

const ensureArray = input => (Array.isArray(input) ? input : [input]);

async function renderPage(req, res) {
  try {
    const areas = await DailySupply.find({}).populate('accountID');

    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });
    const assignedAccounts = await DailySupply.distinct('accountID');
    const unassignedHamLuongAccounts = hamLuongAccounts.filter(
      account =>
        !assignedAccounts
          .map(id => id.toString())
          .includes(account._id.toString()),
    );

    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);
    res.render('src/dailySupplyPage', {
      layout: './layouts/defaultLayout',
      title: 'Dữ liệu mủ hằng ngày',
      unassignedHamLuongAccounts,
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
    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers');
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

async function addArea(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const supplierNames = ensureArray(req.body.supplierName);
    const codes = ensureArray(req.body.code);

    const existingArea = await DailySupply.findOne({ name: req.body.areaName });
    if (existingArea) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Khu vực đã tồn tại!',
        req.headers.referer,
      );
    }

    const suppliers = supplierNames.map((name, index) => ({
      name: name || '',
      code: codes[index] || '',
    }));

    const createdSuppliers = await Supplier.create(suppliers);

    const suppliersId = createdSuppliers.map(supplier => supplier._id);

    const newData = await DailySupply.create({
      ...req.body,
      name: req.body.areaName,
      suppliers: suppliersId,
    });

    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo khu vực thất bại!',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      201,
      'success',
      'Tạo khu vực thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.log(error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteArea(req, res) {
  try {
    const area = await DailySupply.findByIdAndDelete(req.params.id);
    if (!area) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa khu vực thất bại!',
        req.headers.referer,
      );
    }

    // Delete corresponding suppliers
    await Supplier.deleteMany({ _id: { $in: area.suppliers } });
    await Supplier.deleteMany({ _id: { $in: area.data.map(d => d.supplier) } });

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa khu vực thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.log(error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function getData(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;

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

async function updateArea(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const id = req.params.id;
    const { accountID, areaName } = req.body;

    // Check if the accountID is already assigned to another area
    const existingArea = await DailySupply.findOne({ accountID, _id: { $ne: id } });
    if (existingArea) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Tài khoản đã được gán cho khu vực khác!',
        req.headers.referer,
      );
    }

    const updateFields = {
      ...req.body,
      name: areaName,
    };

    const newData = await DailySupply.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    if (!newData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật khu vực thất bại!',
        req.headers.referer,
      );
    }
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật khu vực thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function addSupplier(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const area = await DailySupply.findById(req.params.id);
    if (!area) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy khu vực!',
        req.headers.referer,
      );
    }
    let supplierName = ensureArray(req.body.supplierName);
    let code = ensureArray(req.body.code);

    for (let i = 0; i < supplierName.length; i++) {
      const name = supplierName[i];
      const supplierCode = code[i];

      const existingSupplier = await Supplier.findOne({
        $or: [{ name }, { code: supplierCode }],
      });

      if (existingSupplier) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Trùng tên hoặc mã nhà vườn!',
          req.headers.referer,
        );
      }

      // Create new supplier
      const newSuppliers = await Supplier.create({ name, code: supplierCode });

      // Add supplier to the area
      area.suppliers.push(newSuppliers._id);
    }

    const updateData = await area.save();
    if (!updateData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Thêm nhà vườn mới thất bại!',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Thêm nhà vườn mới thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteSupplier(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa nhà vườn thất bại!',
        req.headers.referer,
      );
    }
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa nhà vườn thành công!',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function editSupplier(req, res) {
  req.body = trimStringFields(req.body);
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name: req.body.supplierName, code: req.body.supplierCode },
      { new: true },
    );
    if (!supplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Sửa thông tin nhà vườn thất bại!',
        req.headers.referer,
      );
    }
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Sửa thông tin nhà vườn thành công!',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}
