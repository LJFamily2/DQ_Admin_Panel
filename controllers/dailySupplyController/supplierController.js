const AccountModel = require('../../models/accountModel');
const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const createSuppliers = require('./helper/createSuppliers');

module.exports = {
  // DetailPage
  renderDetailPage,
  updateArea,
  addSupplier,
  deleteSupplier,
  editSupplier,
};

async function renderDetailPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers')
      .populate('data.supplier');
    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });

    res.render('src/dailySupplyDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Dữ liệu mủ của ${area.name}`,
      hamLuongAccounts,
      area,
      startDate,
      endDate,
      user: req.user,
      messages: req.flash(),
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
    const existingArea = await DailySupply.findOne({
      accountID,
      _id: { $ne: id },
    });
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

    const suppliers = await createSuppliers(req);

    for (const supplier of suppliers) {
      const existingSupplier = await Supplier.findOne({
        $or: [{ name: supplier.name }, { code: supplier.code }],
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

      const newSupplier = await Supplier.create(supplier);
      area.suppliers.push(newSupplier._id);
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
    // Generate new slug if code is changed
    const existingSupplier = await Supplier.findById(req.params.id);
    const newSlug = req.body.code ? `${req.body.code}-${Math.floor(100000 + Math.random() * 900000)}` : existingSupplier.supplierSlug;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        supplierSlug: newSlug, 
        ratioSplit: req.body.ratioSplit
          ? req.body.ratioSplit.replace(',', '.')
          : 0,
      },
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
module.exports = {
  // DetailPage
  renderDetailPage,
  updateArea,
  addSupplier,
  deleteSupplier,
  editSupplier,
};
