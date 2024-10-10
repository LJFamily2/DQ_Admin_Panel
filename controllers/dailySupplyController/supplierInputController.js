const { Supplier, DailySupply } = require('../../models/dailySupplyModel');

const handleResponse = require('../utils/handleResponse');
const convertToDecimal = require('../utils/convertToDecimal');
const trimStringFields = require('../utils/trimStringFields');

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
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

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
    // Get today's date at midnight
    const today = new Date();

    // Check the number of entries for today
    const dailySupply = await DailySupply.findById(req.params.id);
    const todayEntries = dailySupply.data.filter(
      entry => new Date(entry.date) === today,
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
      return {
        name: name,
        percentage: name === 'Mủ nước' ? convertToDecimal(req.body.percentage) : 0,
        quantity: convertToDecimal(req.body.quantity[index] || 0), 
      };
    });

    const inputedData = {
      date: today,
      rawMaterial: rawMaterials,
      supplier: existedSupplier._id,
      note: trimStringFields(req.body.note) || '', 
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
      muDongQuantity,
      muNuocPrice,
      muTapPrice,
      muKePrice,
      muDongPrice,
      note,
    } = req.body;

    // Find the supplier by supplierSlug
    let supplierDoc = await Supplier.findOne(
      { supplierSlug: supplier } 
    );

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

    // Prepare the raw material data
    const rawMaterial = [
      { 
        name: 'Mủ nước', 
        quantity: convertToDecimal(muNuocQuantity), 
        percentage: convertToDecimal(muNuocPercentage), 
        price: convertToDecimal(muNuocPrice) 
      },
      { 
        name: 'Mủ tạp', 
        quantity: convertToDecimal(muTapQuantity), 
        price: convertToDecimal(muTapPrice) 
      },
      { 
        name: 'Mủ ké', 
        quantity: convertToDecimal(muKeQuantity), 
        price: convertToDecimal(muKePrice) 
      },
      { 
        name: 'Mủ đông', 
        quantity: convertToDecimal(muDongQuantity), 
        price: convertToDecimal(muDongPrice) 
      },
    ];

    // Update the daily supply data
    const updatedData = await DailySupply.findOneAndUpdate(
      { 'data._id': id },
      {
        $set: {
          'data.$.date': new Date(date),
          'data.$.supplier': supplierDoc._id, 
          'data.$.rawMaterial': rawMaterial,
          'data.$.note': trimStringFields(note) || '',
        },
      },
      { new: true }
    );

    if (!updatedData) {
      return handleResponse(req, res, 404, 'fail', 'Cập nhật dữ liệu thất bại!', req.headers.referer);
    }

    return handleResponse(req, res, 200, 'success', 'Cập nhật dữ liệu thành công!', req.headers.referer);
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
