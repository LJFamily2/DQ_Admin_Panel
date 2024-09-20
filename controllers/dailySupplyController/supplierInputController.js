const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const handleResponse = require('../utils/handleResponse');

async function renderInputDataDashboardPage(req, res) {
  try {
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
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error adding suppliers:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function renderInputDataPage(req, res) {
  try {
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
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

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
      messages: req.flash(),
      limitReached,
    });
  } catch (error) {
    res.status(500).render('partials/500', { layout: false });
  }
}

async function addData(req, res) {
  console.log(req.body);
  try {
    // Get today's date at midnight
    const today = new Date().setUTCHours(0, 0, 0, 0);

    // Check the number of entries for today
    const dailySupply = await DailySupply.findById(req.params.id);
    const todayEntries = dailySupply.data.filter(
      entry => new Date(entry.date).setUTCHours(0, 0, 0, 0) === today,
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

    const existedSupplier = await Supplier.findOne({ name: req.body.supplier });
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

    // Prepare the input data
    const rawMaterials = req.body.name.map((name, index) => {
      let percentage = 0;
      if (name === 'Mủ nước') {
        percentage = req.body.percentage[0] || 0;
      } else if (name === 'Mủ ké' || name === 'Mủ đông') {
        percentage = req.body.percentage[1] || 0;
      }
      return {
        name: name,
        percentage: name === 'Mủ tạp' ? undefined : percentage,
        quantity: req.body.quantity[index] || 0,
        price: 0, // Assuming price is not provided in req.body
      };
    });

    const inputedData = {
      date: today,
      rawMaterial: rawMaterials,
      supplier: existedSupplier._id,
    };

    const newData = await DailySupply.findByIdAndUpdate(
      req.params.id,
      { $push: { data: inputedData } },
      { new: true },
    );

    if (!newData) {
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
    const {
      date,
      supplier,
      muNuocQuantity,
      muNuocPercentage,
      muTapQuantity,
      muKeQuantity,
      muKePercentage,
      muDongQuantity,
    } = req.body;

    // Find the supplier by name
    let supplierDoc = await Supplier.findOne({ name: supplier });

    let supplierId;
    if (supplierDoc) {
      // If the supplier exists, use the existing supplier's ID
      supplierId = supplierDoc._id;
    } else {
      // If the supplier does not exist, get the current supplier ID from the document
      const currentData = await DailySupply.findOne(
        { 'data._id': id },
        { 'data.$': 1 },
      );
      const currentSupplierId = currentData.data[0].supplier;

      // Update the current supplier's name to the inputted supplier name
      await Supplier.updateOne(
        { _id: currentSupplierId },
        { $set: { name: supplier } },
      );

      supplierId = currentSupplierId;
    }

    // Update the daily supply data with the new values
    const updatedData = await DailySupply.findOneAndUpdate(
      { 'data._id': id },
      {
        $set: {
          'data.$.date': new Date(date),
          'data.$.supplier': supplierId,
          'data.$.rawMaterial': [
            {
              name: 'Mủ nước',
              quantity: muNuocQuantity,
              percentage: muNuocPercentage,
            },
            { name: 'Mủ tạp', quantity: muTapQuantity },
            {
              name: 'Mủ ké',
              quantity: muKeQuantity,
              percentage: muKePercentage,
            },
            {
              name: 'Mủ đông',
              quantity: muDongQuantity,
              percentage: muKePercentage,
            },
          ],
        },
      },
      { new: true },
    );

    if (!updatedData) {
      return handleResponse(
        req,
        res,
        404,
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

    // Find and delete the sub-document by ID
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

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa dữ liệu thành công!',
      req.headers.referer,
    );
  } catch (err) {
    console.error('Error deleting supplier data:', err);
    res.status(500).render('partials/500', { layout: false });
  }
}
module.exports = {
  // User side for input data
  renderInputDataDashboardPage,
  renderInputDataPage,
  addData,
  updateSupplierData,
  deleteSupplierData,
};
