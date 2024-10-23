const AccountModel = require('../../models/accountModel');
const { Debt, MoneyRetained, Supplier, DailySupply } = require('../../models/dailySupplyModel');
const slugify = require('slugify');

const trimStringFields = require('../utils/trimStringFields');
const handleResponse = require('../utils/handleResponse');
const createSuppliers = require('./helper/createSuppliers');
const convertToDecimal = require('../utils/convertToDecimal');
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

    // Find the manager supplier
    const managerSupplier = area.suppliers.find(
      supplier => supplier.manager === true,
    );

    res.render('src/dailySupplyDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Dữ liệu mủ của ${area.name}`,
      hamLuongAccounts,
      area,
      startDate,
      endDate,
      user: req.user,
      messages: req.flash(),
      managerSupplier,
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
    const { accountID, areaName, limitData } = req.body;

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

    const currentArea = await DailySupply.findById(id);
    if (!currentArea) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy khu vực!',
        req.headers.referer,
      );
    }

    const updateFields = {
      ...req.body,
      name: areaName,
      limitData: limitData || currentArea.limitData,
      areaPrice: convertToDecimal(req.body.areaPrice) || currentArea.areaPrice,
    };

    // Only update slug if areaName has changed and is a non-empty string
    if (
      typeof areaName === 'string' &&
      areaName.trim() !== '' &&
      areaName !== currentArea.name
    ) {
      updateFields.slug = slugify(areaName, { lower: true, trim: true });
    }

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
      `/nhap-du-lieu/${newData.slug}`,
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
    const supplier = await Supplier.findById(req.params.id);
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

    // Find all data entries associated with the supplier
    const dataEntries = await DailySupply.find({ 'data.supplier': supplier._id });

    // Collect all debt and moneyRetained IDs
    const debtIds = [];
    const moneyRetainedIds = [];
    dataEntries.forEach(entry => {
      entry.data.forEach(data => {
        if (data.supplier.equals(supplier._id)) {
          if (data.debt) debtIds.push(data.debt);
          if (data.moneyRetained) moneyRetainedIds.push(data.moneyRetained);
        }
      });
    });

    // Delete all associated data, debt, and moneyRetained documents
    await Promise.all([
      DailySupply.updateMany(
        { 'data.supplier': supplier._id },
        { $pull: { data: { supplier: supplier._id } } }
      ),
      Debt.deleteMany({ _id: { $in: debtIds } }),
      MoneyRetained.deleteMany({ _id: { $in: moneyRetainedIds } }),
    ]);

    // Delete the supplier
    const deleteSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if(!deleteSupplier){
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
    console.error('Error deleting supplier:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function editSupplier(req, res) {
  console.log(req.body);
  req.body = trimStringFields(req.body);
  try {
    // Generate new slug only if code is changed
    const existingSupplier = await Supplier.findById(req.params.id);
    let newSlug = existingSupplier.supplierSlug;
    if (req.body.code && req.body.code !== existingSupplier.code) {
      newSlug = `${req.body.code}-${Math.floor(
        100000 + Math.random() * 900000,
      )}`;
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        supplierSlug: newSlug,
        ratioSumSplit: req.body.ratioSumSplit
          ? req.body.ratioSumSplit.replace(',', '.')
          : 0,
        purchasedAreaPrice: convertToDecimal(req.body.purchasedAreaPrice),
        areaDeposit: convertToDecimal(req.body.areaDeposit),
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

    // Determine the redirect URL based on whether the slug has changed
    const redirectUrl =
      newSlug !== existingSupplier.supplierSlug
        ? req.headers.referer.replace(existingSupplier.supplierSlug, newSlug)
        : req.headers.referer;

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Sửa thông tin nhà vườn thành công!',
      redirectUrl,
    );
  } catch (error) {
    console.error('Error editing supplier:', error);
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
