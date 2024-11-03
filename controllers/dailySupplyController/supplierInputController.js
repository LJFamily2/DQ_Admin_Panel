const {
  Debt,
  MoneyRetained,
  Supplier,
  DailySupply,
} = require('../../models/dailySupplyModel');
const ActionHistory = require('../../models/actionHistoryModel');

const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');
const trimStringFields = require('../utils/trimStringFields');
const calculateFinancials = require('../dailySupplyController/helper/calculateFinancials');

module.exports = {
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
      areas = await DailySupply.find()
        .populate('suppliers')
        .populate('data.supplier');
    } else {
      const area = await DailySupply.findOne({ accountID: req.user._id })
        .populate('suppliers')
        .populate('data.supplier');
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
    const isAdmin = req.user.role === 'Admin';

    const area = await DailySupply.findOne({
      slug: req.params.slug,
      ...(isAdmin ? {} : { accountID: req.user._id }),
    })
      .populate('suppliers')
      .populate('data.supplier');

    if (!area) {
      return res.status(404).render('partials/404', { layout: false });
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(startOfToday.getUTCHours() + 7);
    const endOfToday = new Date();
    endOfToday.setUTCHours(endOfToday.getUTCHours() + 7);

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
    req.body = trimStringFields(req.body);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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

    const rawMaterials = req.body.name.map((name, index) => ({
      name,
      percentage: name === 'Mủ nước' ? convertToDecimal(req.body.percentage) : 0,
      ratioSplit: existedSupplier.ratioRubberSplit,
      quantity: convertToDecimal(req.body.quantity[index] || 0),
      price: 0,
    }));

    let debt, moneyRetained;
    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      [debt, moneyRetained] = await Promise.all([
        Debt.create({ date: today, debtPaidAmount: 0 }),
        MoneyRetained.create({
          date: today,
          retainedAmount: 0,
          percentage: existedSupplier.moneyRetainedPercentage,
        }),
      ]);
    }

    const inputedData = {
      date: today,
      rawMaterial: rawMaterials,
      supplier: existedSupplier._id,
      note: trimStringFields(req.body.note) || '',
      debt: debt?._id,
      moneyRetained: moneyRetained?._id,
    };

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
    req.body = trimStringFields(req.body)
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
      moneyRetainedPercentage, 
    } = req.body;

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

    const dataIndex = dailySupply.data.findIndex(item => item._id.toString() === id);
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

    const dataBeforeUpdate = JSON.parse(JSON.stringify(dailySupply.data[dataIndex]));

    const updatedRawMaterial = dailySupply.data[dataIndex].rawMaterial.map(item => {
      const updatedItem = { ...item };
      switch (item.name) {
        case 'Mủ nước':
          updatedItem.quantity = convertToDecimal(muNuocQuantity);
          updatedItem.percentage = convertToDecimal(muNuocPercentage);
          updatedItem.ratioSplit = convertToDecimal(muNuocRatioSplit);
          updatedItem.price = convertToDecimal(muNuocPrice);
          break;
        case 'Mủ tạp':
          updatedItem.quantity = convertToDecimal(muTapQuantity);
          updatedItem.ratioSplit = convertToDecimal(muTapRatioSplit);
          updatedItem.price = convertToDecimal(muTapPrice);
          break;
        case 'Mủ ké':
          updatedItem.quantity = convertToDecimal(muKeQuantity);
          updatedItem.ratioSplit = convertToDecimal(muKeRatioSplit);
          updatedItem.price = convertToDecimal(muKePrice);
          break;
        case 'Mủ đông':
          updatedItem.quantity = convertToDecimal(muDongQuantity);
          updatedItem.ratioSplit = convertToDecimal(muDongRatioSplit);
          updatedItem.price = convertToDecimal(muDongPrice);
          break;
      }
      return updatedItem;
    });

    dailySupply.data[dataIndex].date = new Date(date);
    dailySupply.data[dataIndex].rawMaterial = updatedRawMaterial;
    dailySupply.data[dataIndex].note = trimStringFields(note) || '';
    
    if (supplier) {
      const supplierDoc = await Supplier.findOne({ supplierSlug: supplier });
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
      dailySupply.data[dataIndex].supplier = supplierDoc._id;
    }

    const updatePromises = [dailySupply.save()];

    if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
      const { debtPaid, retainedAmount } = calculateFinancials(
        updatedRawMaterial,
        moneyRetainedPercentage || dailySupply.data[dataIndex].moneyRetained.percentage,
      );
      const debtPaidDifference = debtPaid - (dailySupply.data[dataIndex].debt.debtPaidAmount || 0);
      const moneyRetainedDifference = retainedAmount - (dailySupply.data[dataIndex].moneyRetained.retainedAmount || 0);

      if (!isNaN(debtPaidDifference)) {
        updatePromises.push(
          Debt.findByIdAndUpdate(
            dailySupply.data[dataIndex].debt._id,
            { $inc: { debtPaidAmount: debtPaidDifference } },
            { new: true },
          )
        );
      }

      const moneyRetainedUpdate = {
        percentage: moneyRetainedPercentage || dailySupply.data[dataIndex].moneyRetained.percentage,
        retainedAmount: !isNaN(debtPaidDifference) ? dailySupply.data[dataIndex].moneyRetained.retainedAmount + moneyRetainedDifference : dailySupply.data[dataIndex].moneyRetained.retainedAmount
      };

      updatePromises.push(
        MoneyRetained.findByIdAndUpdate(
          dailySupply.data[dataIndex].moneyRetained._id,
          moneyRetainedUpdate,
          { new: true },
        )
      );
    }

    const [updatedDailySupply] = await Promise.all(updatePromises);

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

    const actionHistory = await ActionHistory.create({
      actionType: 'update',
      userId: req.user._id,
      details: `Cập nhật dữ liệu cho ${updatedDailySupply.name}`,
      oldValues: dataBeforeUpdate,
      newValues: dailySupply.data[dataIndex],
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
      const existingRequest = dailySupply.deletionRequests.find(
        (request) => request.dataId.toString() === id
      );

      if (existingRequest) {
        return handleResponse(
          req,
          res,
          400,
          'fail',
          'Đã gửi yêu cầu xóa của dữ liệu này!',
          req.headers.referer,
        );
      }

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
    } else if (userRole === 'Giám đốc' || userRole === 'Admin') {
      const subDocument = dailySupply.data.id(id);
      if (!subDocument) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Không tìm thấy dữ liệu con!',
          req.headers.referer,
        );
      }

      const supplierId = subDocument.supplier;

      const updatedData = await DailySupply.findOneAndUpdate(
        { 'data._id': id },
        { $pull: { data: { _id: id } } },
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

      let updateSupplierDataPromise;
      let deletePromises = [];

      if (dailySupply.areaPrice > 0 && dailySupply.areaDimension > 0) {
        const debtId = subDocument.debt;
        const moneyRetainedId = subDocument.moneyRetained;

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

        if (debtId) {
          deletePromises.push(Debt.findByIdAndDelete(debtId));
        }
        if (moneyRetainedId) {
          deletePromises.push(MoneyRetained.findByIdAndDelete(moneyRetainedId));
        }
      }

      const actionHistoryPromise = ActionHistory.create({
        actionType: 'delete',
        userId: req.user._id,
        details: `Xóa dữ liệu cho ${updatedData.name}`,
        oldValues: subDocument,
      });

      const promises = [
        ...deletePromises,
        actionHistoryPromise,
      ];

      if (updateSupplierDataPromise) {
        promises.push(updateSupplierDataPromise);
      }

      const results = await Promise.all(promises);

      const updateSupplierData = updateSupplierDataPromise ? results.pop() : null;

      if (updateSupplierDataPromise && !updateSupplierData) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Xóa dữ liệu cho nhà vườn thất bại!',
          req.headers.referer,
        );
      }

      // Remove the deletionRequests entry that holds the dataId matching the id parameter
      dailySupply.deletionRequests = dailySupply.deletionRequests.filter(
        request => request.dataId.toString() !== id
      );
      await dailySupply.save();

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