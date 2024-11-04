const AccountModel = require('../../models/accountModel');
const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require('../../models/dailySupplyModel');
const ActionHistory = require('../../models/actionHistoryModel');

const slugify = require('slugify');
const getChangedFields = require('../utils/getChangedFields');
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
  rejectDeletionRequest,
  deleteAllRequests,
};

async function getRawMaterialData(deletionRequestId) {
  try {
    const dailySupply = await DailySupply.findOne({
      'deletionRequests.dataId': deletionRequestId,
    }).populate({
      path: 'data',
      populate: {
        path: 'rawMaterial',
      },
    });

    if (!dailySupply) {
      throw new Error('DailySupply document not found');
    }

    const dataEntry = dailySupply.data.find(entry =>
      entry._id.equals(deletionRequestId),
    );

    if (!dataEntry) {
      throw new Error('Data entry not found');
    }

    return {
      rawMaterial: dataEntry.rawMaterial,
      note: dataEntry.note,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function renderDetailPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const area = await DailySupply.findOne({ slug: req.params.slug })
      .populate('accountID')
      .populate('suppliers')
      .populate({
        path: 'deletionRequests.requestedBy',
        select: ['username', 'role'],
      })
      .populate('data.supplier');

    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });

    // Find the manager supplier
    const managerSupplier = area.suppliers.find(
      supplier => supplier.manager === true,
    );

    // Fetch rawMaterial data for each deletionRequest
    const deletionRequestsWithRawMaterial = await Promise.all(
      area.deletionRequests.map(async request => {
        const { rawMaterial, note } = await getRawMaterialData(request.dataId);
        return {
          ...request.toObject(),
          rawMaterial,
          note,
        };
      }),
    );

    res.render('src/dailySupplyDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Dữ liệu mủ của ${area.name}`,
      hamLuongAccounts,
      area: {
        ...area.toObject(),
        deletionRequests: deletionRequestsWithRawMaterial,
      },
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

    const [newData, actionHistory] = await Promise.all([
      DailySupply.findByIdAndUpdate(id, updateFields, { new: true }),
      ActionHistory.create({
        actionType: 'update',
        userId: req.user._id,
        details: `Cập nhật khu vực ${areaName}`,
        oldValues: currentArea,
        newValues: updateFields,
      }),
    ]);

    if (!newData || !actionHistory) {
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
  console.log(req.body);
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

    // Calculate the total purchasedAreaDimension for new suppliers
    const totalPurchasedAreaDimension = suppliers.reduce((total, supplier) => {
      return total + supplier.purchasedAreaDimension || 0;
    }, 0);

    // Check if remainingAreaDimension is sufficient
    if (totalPurchasedAreaDimension > area.remainingAreaDimension) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Diện tích khả dụng không đủ!',
        req.headers.referer,
      );
    }

    // Check for existing suppliers concurrently
    const existingSuppliers = await Promise.all(
      suppliers.map(supplier => Supplier.findOne({ code: supplier.code })),
    );

    if (existingSuppliers.some(supplier => supplier)) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Trùng mã nhà vườn!',
        req.headers.referer,
      );
    }

    // Create new suppliers concurrently
    const newSuppliers = await Promise.all(
      suppliers.map(supplier => Supplier.create(supplier)),
    );

    // Update the area with new supplier IDs
    newSuppliers.forEach(supplier => area.suppliers.push(supplier._id));

    // Update remainingAreaDimension
    if (area.areaDimension > 0 && area.areaPrice > 0) {
      area.remainingAreaDimension -= totalPurchasedAreaDimension;
    }

    const updateData = await area.save();
    if (!updateData) {
      return handleResponse(
        req,
        res,
        500,
        'fail',
        'Thêm nhà vườn mới thất bại!',
        req.headers.referer,
      );
    }

    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'create',
      userId: req.user._id,
      details: `Thêm nhà vườn vào khu vực ${area.name}`,
      newValues: newSuppliers,
    });
    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        500,
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
    const dataEntries = await DailySupply.find({
      'data.supplier': supplier._id,
    });

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

    // Delete all associated data, debt, and moneyRetained documents concurrently
    await Promise.all([
      DailySupply.updateMany(
        { 'data.supplier': supplier._id },
        { $pull: { data: { supplier: supplier._id } } },
      ),
      Debt.deleteMany({ _id: { $in: debtIds } }),
      MoneyRetained.deleteMany({ _id: { $in: moneyRetainedIds } }),
    ]);

    // Add back the purchasedAreaDimension to the remainingAreaDimension
    const dailySupply = await DailySupply.findOne({ suppliers: supplier._id });
    if (dailySupply) {
      dailySupply.remainingAreaDimension += supplier.purchasedAreaDimension;
      const addedAreaBack = await dailySupply.save();
      if (!addedAreaBack) {
        return handleResponse(
          req,
          res,
          500,
          'fail',
          'Thêm lại diện tích khả dụng thất bại!',
          req.headers.referer,
        );
      }
    }

    // Delete the supplier
    const deleteSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleteSupplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa nhà vườn thất bại!',
        req.headers.referer,
      );
    }

    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'delete',
      userId: req.user._id,
      details: `Xóa nhà vườn ${supplier.name} (${supplier.code})`,
      oldValues: deleteSupplier,
    });
    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        500,
        'fail',
        'Ghi lại lịch sử hành động thất bại!',
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
  req.body = trimStringFields(req.body);
  console.log(req.body);
  try {
    // Find the existing supplier
    const existingSupplier = await Supplier.findById(req.params.id);
    if (!existingSupplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Nhà vườn không tồn tại!',
        req.headers.referer,
      );
    }

    // Generate new slug only if code is changed
    let newSlug = existingSupplier.supplierSlug;
    if (req.body.code && req.body.code !== existingSupplier.code) {
      newSlug = `${req.body.code}-${Math.floor(
        100000 + Math.random() * 900000,
      )}`;
    }

    // Calculate initial debt amount if relevant fields are provided
    const purchasedAreaDimension =
      parseFloat(req.body.purchasedAreaDimension) || 0;
    const purchasedAreaPrice =
      convertToDecimal(req.body.purchasedAreaPrice) || 0;
    const areaDeposit = convertToDecimal(req.body.areaDeposit) || 0;

    let initialDebtAmount = existingSupplier.initialDebtAmount;
    if (
      purchasedAreaDimension > 0 ||
      purchasedAreaPrice > 0 ||
      areaDeposit > 0
    ) {
      initialDebtAmount =
        purchasedAreaDimension * purchasedAreaPrice - areaDeposit;
    }

    // Fetch the DailySupply document to get the remainingAreaDimension
    const dailySupply = await DailySupply.findOne({ slug: req.body.slug });
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy khu vực!',
        req.headers.referer,
      );
    }

    // Calculate the difference in purchasedAreaDimension
    const oldPurchasedAreaDimension =
      existingSupplier.purchasedAreaDimension || 0;
    const dimensionDifference =
      purchasedAreaDimension - oldPurchasedAreaDimension;

    // Update remainingAreaDimension
    const remainingAreaDimension =
      dailySupply.remainingAreaDimension - dimensionDifference;
    if (remainingAreaDimension < 0) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Không còn diện tích trống!',
        req.headers.referer,
      );
    }

    // Update the supplier and remainingAreaDimension concurrently
    const [supplier, updatedDailySupply] = await Promise.all([
      Supplier.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          initialDebtAmount,
          supplierSlug: newSlug,
          moneyRetainedPercentage: convertToDecimal(
            req.body.moneyRetainedPercentage,
          ),
          ratioRubberSplit: convertToDecimal(req.body.ratioRubberSplit),
          ratioSumSplit: convertToDecimal(req.body.ratioSumSplit),
          purchasedAreaPrice,
          areaDeposit,
        },
        { new: true },
      ),
      DailySupply.findOneAndUpdate(
        { slug: req.body.slug },
        { remainingAreaDimension },
        { new: true },
      ),
    ]);

    if (!supplier || !updatedDailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Sửa thông tin nhà vườn thất bại!',
        req.headers.referer,
      );
    }

    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'update',
      userId: req.user._id,
      details: `Cập nhật nhà vườn ${supplier.code}`,
      oldValues: existingSupplier,
      newValues: supplier,
    });
    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        500,
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

async function rejectDeletionRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    // Update the status of the deletion request to 'rejected'
    const dailySupply = await DailySupply.findOneAndUpdate(
      { 'deletionRequests._id': requestId },
      { 'deletionRequests.$.status': 'rejected' },
      { new: true },
    );

    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy yêu cầu xóa!',
        req.headers.referer,
      );
    }

    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'update',
      userId: req.user._id,
      details: `Từ chối yêu cầu xóa dữ liệu ${requestId}`,
      oldValues: { status: 'pending' },
      newValues: { status: 'rejected' },
    });

    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        500,
        'fail',
        'Ghi lại lịch sử hành động thất bại!',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Từ chối yêu cầu xóa thành công!',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error rejecting deletion request:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteAllRequests(req, res) {
  try {
    const { slug } = req.params;

    // Find the dailySupply document
    const dailySupply = await DailySupply.findOne({ slug }).populate('deletionRequests.requestedBy');
    if (!dailySupply) {
      return handleResponse(req, res, 404, 'fail', 'Không tìm thấy khu vực!', req.headers.referer);
    }

    // Find the deletion requests
    const deletionRequests = dailySupply.deletionRequests;
    if (!deletionRequests.length) {
      return handleResponse(req, res, 404, 'fail', 'Không có yêu cầu xóa!', req.headers.referer);
    }

    // Delete all deletion requests and create action history concurrently
    dailySupply.deletionRequests = [];
    const [updatedDailySupply, actionHistory] = await Promise.all([
      dailySupply.save(),
      ActionHistory.create({
        actionType: 'delete',
        userId: req.user._id,
        details: `Xóa tất cả yêu cầu xóa dữ liệu của ${slug}`,
        oldValues: deletionRequests,
      }),
    ]);

    if (!updatedDailySupply) {
      return handleResponse(req, res, 500, 'fail', 'Xóa yêu cầu xóa thất bại!', req.headers.referer);
    }
    if (!actionHistory) {
      return handleResponse(req, res, 500, 'fail', 'Ghi lại lịch sử hành động thất bại!', req.headers.referer);
    }

    return handleResponse(req, res, 200, 'success', 'Xóa tất cả yêu cầu xóa thành công!', req.headers.referer);
  } catch (error) {
    console.error('Error deleting all requests:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}
