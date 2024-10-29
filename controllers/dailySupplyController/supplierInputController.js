const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require('../../models/dailySupplyModel');
const ActionHistory = require('../../models/actionHistoryModel')

const getChangedFields = require('../utils/getChangedFields');
const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');
const trimStringFields = require('../utils/trimStringFields');
const calculateFinancials = require('../dailySupplyController/helper/calculateFinancials');

module.exports = {
  // User side for input data
  renderInputDataDashboardPage,
  renderInputDataPage,
  addData,
  updateSupplierData,
  deleteSupplierData,
};

async function renderInputDataDashboardPage(req, res) {
  try {
    const { startDate, endDate } = req.query;

    let areas;

    if (req.user.role === 'Admin') {
      // Fetch all areas if the user is an Admin
      areas = await DailySupply.find()
        .populate('suppliers')
        .populate('data.supplier');
    } else {
      // Fetch only the areas assigned to the user by accountID
      const area = await DailySupply.findOne({
        accountID: req.user._id,
      })
        .populate('suppliers')
        .populate('data.supplier');

      // Ensure areas is an array
      areas = area ? [area] : [];
    }

    res.render('src/dailySupplyInputDashboardPage', {
      layout: './layouts/defaultLayout',
      title: `Nguyên liệu hằng ngày`,
      areas,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function renderInputDataPage(req, res) {
  try {
    const { startDate, endDate } = req.query;
    // Check if the user has the 'Admin' role
    const isAdmin = req.user.role === 'Admin';

    // Find the DailySupply document based on the slug and accountID
    const area = await DailySupply.findOne({
      slug: req.params.slug,
      ...(isAdmin ? {} : { accountID: req.user._id }), // If not admin, add accountID to the query
    })
      .populate('suppliers')
      .populate('data.supplier');

    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    // Get today's start and end dates
    const startOfToday = new Date();
    startOfToday.setUTCHours(startOfToday.getUTCHours() + 7);
    const endOfToday = new Date();
    endOfToday.setUTCHours(endOfToday.getUTCHours() + 7);

    // Count the number of entries for today
    const todayEntriesCount = await DailySupply.aggregate([
      { $match: { _id: area._id } },
      { $unwind: '$data' },
      { $match: { 'data.date': { $gte: startOfToday, $lte: endOfToday } } },
      { $count: 'count' },
    ]);

    const limitReached =
      todayEntriesCount.length > 0
        ? todayEntriesCount[0].count >= area.limitData
        : false;

    res.render('src/dailySupplyInputPage', {
      layout: './layouts/defaultLayout',
      title: `Nguyên liệu hằng ngày ${area.name}`,
      area,
      user: req.user,
      startDate,
      endDate,
      messages: req.flash(),
      limitReached,
    });
  } catch (error) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function addData(req, res) {
  try {
    // Trim request body strings
    req.body = trimStringFields(req.body);

    // Get today's date at midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find the DailySupply entry by ID
    const dailySupply = await DailySupply.findById(req.params.id);
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy DailySupply!',
        req.headers.referer,
      );
    }

    // Check the number of entries for today
    const todayEntries = dailySupply.data.filter(
      entry => new Date(entry.date).toDateString() === today.toDateString(),
    );
    if (todayEntries.length >= dailySupply.limitData) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Đã đạt giới hạn dữ liệu hàng ngày!',
        req.headers.referer,
      );
    }

    // Find the existing supplier by name
    const existedSupplier = await Supplier.findOne({ supplierSlug: req.body.supplier });
    if (!existedSupplier) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Nhà vườn không tồn tại!',
        req.headers.referer,
      );
    }

    // Prepare raw material entries
    const rawMaterials = req.body.name.map((name, index) => ({
      name,
      percentage:
        name === 'Mủ nước' ? convertToDecimal(req.body.percentage) : 0,
      ratioSplit: existedSupplier.ratioRubberSplit,
      quantity: convertToDecimal(req.body.quantity[index] || 0),
      price: 0,
    }));

    let debt;
    let moneyRetained;
    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      // Create debt and retained money entries concurrently
      [debt, moneyRetained] = await Promise.all([
        Debt.create({
          date: today,
          debtPaidAmount: 0,
        }),
        MoneyRetained.create({
          date: today,
          retainedAmount: 0,
          percentage: existedSupplier.moneyRetainedPercentage,
        }),
      ]);
    }

    // Create input data for DailySupply
    const inputedData = {
      date: today,
      rawMaterial: rawMaterials,
      supplier: existedSupplier._id,
      note: trimStringFields(req.body.note) || '',
      debt: debt?._id,
      moneyRetained: moneyRetained?._id,
    };

    // Save the new data to DailySupply and update the supplier concurrently
    const [newData, updateSupplier] = await Promise.all([
      DailySupply.findByIdAndUpdate(
        req.params.id,
        { $push: { data: inputedData } },
        { new: true, upsert: true },
      ),
      (async () => {
        existedSupplier.debtHistory.push(debt?._id);
        existedSupplier.moneyRetainedHistory.push(moneyRetained?._id);
        return existedSupplier.save();
      })(),
    ]);

    if (!newData || !updateSupplier) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Thêm dữ liệu thất bại!',
        req.headers.referer,
      );
    }

    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'create',
      userId: req.user._id,
      details: `Thêm dữ liệu cho ${existedSupplier.name} của vườn ${newData.name}`,
      newValues: inputedData,
    });

    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Thêm dữ liệu thất bại!',
        req.headers.referer,
      );
    }

    // Success response
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Thêm dữ liệu thành công!',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function updateSupplierData(req, res) {
  try {
    const { id } = req.params;
    req.body = trimStringFields(req.body);
    const {
      date,
      supplier,
      muNuocQuantity,
      muNuocPercentage,
      muNuocRatioSplit,
      muTapQuantity,
      muTapRatioSplit,
      muKeQuantity,
      muKeRatioSplit,
      muDongQuantity,
      muDongRatioSplit,
      muNuocPrice,
      muTapPrice,
      muKePrice,
      muDongPrice,
      note,
    } = req.body;

    let supplierDoc;

    if (supplier) {
      supplierDoc = await Supplier.findOne({ supplierSlug: supplier });
      if (!supplierDoc) {
        return handleResponse(
          req,
          res,
          400,
          'fail',
          'Nhà vườn không tồn tại!',
          req.headers.referer,
        );
      }
    }

    const dailySupply = await DailySupply.findOne({ 'data._id': id }).populate({
      path: 'data',
      populate: ['debt', 'moneyRetained'],
    });
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy dữ liệu!',
        req.headers.referer,
      );
    }

    const dataIndex = dailySupply.data.findIndex(
      item => item._id.toString() === id,
    );
    if (dataIndex === -1) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy dữ liệu!',
        req.headers.referer,
      );
    }

    // Make a deep copy of the data before updating
    const dataBeforeUpdate = JSON.parse(JSON.stringify(dailySupply.data[dataIndex]));

    const updatedRawMaterial = dailySupply.data[dataIndex].rawMaterial.map(
      item => {
        const updatedItem = { ...item };
        if (item.name === 'Mủ nước') {
          updatedItem.quantity = convertToDecimal(muNuocQuantity);
          updatedItem.percentage = convertToDecimal(muNuocPercentage);
          updatedItem.ratioSplit = convertToDecimal(muNuocRatioSplit);
          updatedItem.price = convertToDecimal(muNuocPrice);
        } else if (item.name === 'Mủ tạp') {
          updatedItem.quantity = convertToDecimal(muTapQuantity);
          updatedItem.ratioSplit = convertToDecimal(muTapRatioSplit);
          updatedItem.price = convertToDecimal(muTapPrice);
        } else if (item.name === 'Mủ ké') {
          updatedItem.quantity = convertToDecimal(muKeQuantity);
          updatedItem.ratioSplit = convertToDecimal(muKeRatioSplit);
          updatedItem.price = convertToDecimal(muKePrice);
        } else if (item.name === 'Mủ đông') {
          updatedItem.quantity = convertToDecimal(muDongQuantity);
          updatedItem.ratioSplit = convertToDecimal(muDongRatioSplit);
          updatedItem.price = convertToDecimal(muDongPrice);
        }
        return updatedItem;
      },
    );

    dailySupply.data[dataIndex].date = new Date(date);
    dailySupply.data[dataIndex].rawMaterial = updatedRawMaterial;
    dailySupply.data[dataIndex].note = trimStringFields(note) || '';
    if (supplierDoc) {
      dailySupply.data[dataIndex].supplier = supplierDoc._id;
    }

    let debtUpdatePromise = Promise.resolve();
    let moneyRetainedUpdatePromise = Promise.resolve();

    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      // Calculate and update debt and money retained
      const { debtPaid, retainedAmount } = calculateFinancials(
        updatedRawMaterial,
        dailySupply.data[dataIndex].moneyRetained.percentage,
      );

      // Store old values
      const oldDebtPaidAmount =
        dailySupply.data[dataIndex].debt.debtPaidAmount || 0;
      const oldMoneyRetainedAmount =
        dailySupply.data[dataIndex].moneyRetained.retainedAmount || 0;

      // Calculate differences
      const debtPaidDifference = debtPaid - oldDebtPaidAmount;
      const moneyRetainedDifference = retainedAmount - oldMoneyRetainedAmount;

      // Update debt and money retained amounts using findByIdAndUpdate
      debtUpdatePromise = Debt.findByIdAndUpdate(
        dailySupply.data[dataIndex].debt._id,
        { $inc: { debtPaidAmount: debtPaidDifference } },
        { new: true },
      );

      moneyRetainedUpdatePromise = MoneyRetained.findByIdAndUpdate(
        dailySupply.data[dataIndex].moneyRetained._id,
        { $inc: { retainedAmount: moneyRetainedDifference } },
        { new: true },
      );
    }

    const [updatedDailySupply, debtUpdate, moneyRetainedUpdate] = await Promise.all([
      dailySupply.save(),
      debtUpdatePromise,
      moneyRetainedUpdatePromise,
    ]);

    if (!updatedDailySupply) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Cập nhật dữ liệu thất bại!',
        req.headers.referer,
      );
    }
    
    // Adding new action history
    const actionHistory = await ActionHistory.create({
      actionType: 'update',
      userId: req.user._id,
      details: `Cập nhật dữ liệu cho ${updatedDailySupply.name}`,
      oldValues: dataBeforeUpdate,
      newValues: dailySupply.data[dataIndex]
    });
    if (!actionHistory) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Cập nhật dữ liệu thất bại!',
        req.headers.referer,
      );
    }

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật dữ liệu thành công!',
      req.headers.referer,
    );
  } catch (err) {
    console.error('Error updating supplier data:', err);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function deleteSupplierData(req, res) {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Find the DailySupply document containing the sub-document to be deleted
    const dailySupply = await DailySupply.findOne({ 'data._id': id });
    if (!dailySupply) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy dữ liệu!',
        req.headers.referer,
      );
    }

    if (userRole === 'Văn phòng') {
      // Add a deletion request
      dailySupply.deletionRequests.push({
        ...req.body,
        requestedBy: req.user._id,
        dataId: id,
      });
      await dailySupply.save();
      return handleResponse(
        req,
        res,
        200,
        'success',
        'Yêu cầu xóa dữ liệu đã được gửi!',
        req.headers.referer,
      );
    } else if (userRole === 'Giám đốc') {
      // Extract the sub-document to be deleted
      const subDocument = dailySupply.data.id(id);
      if (!subDocument) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Không tìm thấy dữ liệu!',
          req.headers.referer,
        );
      }
      const supplierId = subDocument.supplier;
      // Remove the sub-document from the DailySupply document
      const updatedData = await DailySupply.findOneAndUpdate(
        { 'data._id': id },
        {
          $pull: { data: { _id: id } },
        },
        { new: true },
      );
      if (!updatedData) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Xóa dữ liệu thất bại!',
          req.headers.referer,
        );
      }
      let updateSupplierDataPromise = Promise.resolve();
      let deletePromises = [];
      if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
        const debtId = subDocument.debt;
        const moneyRetainedId = subDocument.moneyRetained;
        // Update the supplier's debtHistory and moneyRetainedHistory
        updateSupplierDataPromise = Supplier.findByIdAndUpdate(
          supplierId,
          {
            $pull: {
              debtHistory: debtId,
              moneyRetainedHistory: moneyRetainedId,
            },
          },
          { new: true },
        );
        // Delete the corresponding debt and money retained documents if they exist
        if (debtId) {
          deletePromises.push(Debt.findByIdAndDelete(debtId));
        }
        if (moneyRetainedId) {
          deletePromises.push(MoneyRetained.findByIdAndDelete(moneyRetainedId));
        }
      }
      const [updateSupplierData, ...deleteResults] = await Promise.all([
        updateSupplierDataPromise,
        ...deletePromises,
      ]);
      if (!updateSupplierData) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Xóa dữ liệu cho nhà vườn thất bại!',
          req.headers.referer,
        );
      }
      // Adding new action history
      const actionHistory = await ActionHistory.create({
        actionType: 'delete',
        userId: req.user._id,
        details: `Xóa dữ liệu cho ${updatedData.name}`,
        oldValues: subDocument,
      });
      if (!actionHistory) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Xóa dữ liệu thất bại!',
          req.headers.referer,
        );
      }
      return handleResponse(
        req,
        res,
        200,
        'success',
        'Xóa dữ liệu thành công!',
        req.headers.referer,
      );
    } else {
      return handleResponse(
        req,
        res,
        403,
        'fail',
        'Không có quyền thao tác!',
        req.headers.referer,
      );
    }
  } catch (err) {
    console.error('Error deleting supplier data:', err);
    res.status(500).render('partials/500', { layout: false });
  }
}