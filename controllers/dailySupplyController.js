const AccountModel = require('../models/accountModel');
const { Supplier, DailySupply } = require('../models/dailySupplyModel');

const trimStringFields = require('./utils/trimStringFields');
const handleResponse = require('./utils/handleResponse');

module.exports = {
  renderPage,
  addArea,
  deleteArea,
  getData,

  // DetailPage
  renderDetailPage,
  updateArea,
  addSupplier,
  getAreaSupplierData,
  deleteSupplier,
  editSupplier,

  // User side for input data
  renderInputDataDashboardPage,
  renderInputDataPage,
  addData,
  getSupplierData,
  updateSupplierData,
  deleteSupplierData,
};

// Helper function 
async function createSuppliers(req) {
  const supplierNames = ensureArray(req.body.supplierName);
  let supplierCode = ensureArray(req.body.code);
  let supplierPhone = ensureArray(req.body.phone);
  let supplierIdentification = ensureArray(req.body.identification);
  let supplierIssueDate = ensureArray(req.body.issueDate);
  let supplierAddress = ensureArray(req.body.address) || '';

  const suppliers = supplierNames.map((name, index) => ({
    name: name,
    code: supplierCode[index],
    phone: supplierPhone[index],
    identification: supplierIdentification[index],
    issueDate: supplierIssueDate[index],
    address: supplierAddress[index] || '',
  }));

  return suppliers;
}

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

    res.render('src/dailySupplyPage', {
      layout: './layouts/defaultLayout',
      title: 'Dữ liệu mủ hằng ngày',
      unassignedHamLuongAccounts,
      areas,
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
      .populate('suppliers')
      .populate('data.supplier');
    const hamLuongAccounts = await AccountModel.find({ role: 'Hàm lượng' });

    res.render('src/dailySupplyDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Dữ liệu mủ của ${area.name}`,
      hamLuongAccounts,
      area,
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

    const suppliers = await createSuppliers(req);

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
    const { draw, start, length, search, order, columns } = req.body;

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
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
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

// User side for input data
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
    console.error('Error rendering input data page:', error);
    res.status(500).render('partials/500', { layout: false });
  }
}

async function addData(req, res) {
  try {
    // Get today's date at midnight
    const today = new Date().setUTCHours(0, 0, 0, 0);

    console.log(today);
    // Check the number of entries for today
    const dailySupply = await DailySupply.findById(req.params.id);
    const todayEntries = dailySupply.data.filter(
      entry => new Date(entry.date).setUTCHours(0, 0, 0, 0) === today,
    );

    console.log(todayEntries.length);

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

    console.log(dailySupply.limitData);

    // Check for existing supplier
    let supplier = await Supplier.findOne({ name: req.body.supplier });

    if (!supplier) {
      // Create new supplier if it doesn't exist
      supplier = new Supplier({ name: req.body.supplier });
      const saveSupplierPromise = supplier.save();
      const updateDailySupplyPromise = DailySupply.findByIdAndUpdate(
        req.params.id,
        { $push: { suppliers: supplier._id } },
        { new: true },
      );

      // Wait for both operations to complete
      await Promise.all([saveSupplierPromise, updateDailySupplyPromise]);
    }

    // Prepare the input data
    const inputedData = {
      date: today,
      dryQuantity: req.body.dryQuantity || 0,
      percentage: req.body.percentage || 0,
      keQuantity: req.body.keQuantity || 0,
      mixedQuantity: req.body.mixedQuantity || 0,
      supplier: supplier._id,
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
async function getSupplierData(req, res) {
  await getSupplierInputData(req, res, false);
}

async function getAreaSupplierData(req, res) {
  await getSupplierInputData(req, res, true);
}

async function getSupplierInputData(req, res, isArea) {
  try {
    const { draw, start, length, search, startDate, endDate } = req.body;
    const searchValue = search?.value?.toLowerCase() || '';

    const { startDateUTC, endDateUTC } = parseDates(startDate, endDate);
    const dateFilter = createDateFilter(startDateUTC, endDateUTC);
    const matchStage = createMatchStage(req.params.slug, dateFilter, searchValue);
    const sortStage = { $sort: { 'data.date': -1 } };
    const pipeline = createPipeline(req.params.slug, matchStage, sortStage);

    const result = await DailySupply.aggregate(pipeline);
    const totalRecords = result[0].totalRecords[0]?.count || 0;
    const data = result[0].data;

    const flattenedData = flattenData(data, isArea);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: flattenedData,
    });
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    res.status(500).render('partials/500', { layout: false });
  }

  function parseDates(startDate, endDate) {
    return {
      startDateUTC: startDate
        ? new Date(startDate).setUTCHours(0, 0, 0, 0)
        : null,
      endDateUTC: endDate
        ? new Date(endDate).setUTCHours(23, 59, 59, 999)
        : null,
    };
  }

  function createDateFilter(startDateUTC, endDateUTC) {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date().setUTCHours(23, 59, 59, 999);
  
    if (startDateUTC && !endDateUTC) {
      endDateUTC = startDateUTC;
    }
  
    return startDateUTC || endDateUTC
      ? {
          'data.date': {
            ...(startDateUTC && { $gte: new Date(startDateUTC) }),
            ...(endDateUTC && { $lte: new Date(endDateUTC) }),
          },
        }
      : {
          'data.date': { $gte: new Date(today), $lte: new Date(tomorrow) },
        };
  }

  function createMatchStage(slug, dateFilter, searchValue) {
    return {
      $match: {
        slug,
        ...dateFilter,
        ...(searchValue && {
          $or: [
            { 'supplier.name': { $regex: searchValue, $options: 'i' } },
            { 'supplier.code': { $regex: searchValue, $options: 'i' } },
          ],
        }),
      },
    };
  }

  function createPipeline(slug, matchStage, sortStage) {
    return [
      { $match: { slug } },
      { $unwind: '$data' },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'data.supplier',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: '$supplier' },
      matchStage,
      sortStage,
      {
        $facet: {
          data: [],
          totalRecords: [{ $count: 'count' }],
        },
      },
    ];
  }

  function flattenData(data, isArea) {
    return data.map((item, index) => ({
      no: index + 1,
      date: new Date(item.data.date).toLocaleDateString('vi-VN'),
      supplier: item.supplier.name || '',
      ...(isArea && { code: item.supplier.code || '' }),
      dryQuantity: item.data.dryQuantity.toLocaleString('vi-VN'),
      percentage: item.data.percentage.toLocaleString('vi-VN'),
      dryTotal: (
        (item.data.dryQuantity * item.data.percentage) /
        100
      ).toLocaleString('vi-VN'),
      mixedQuantity: item.data.mixedQuantity.toLocaleString('vi-VN'),
      keQuantity: item.data.keQuantity.toLocaleString('vi-VN'),
      keTotal: (
        (item.data.keQuantity * item.data.percentage) /
        100
      ).toLocaleString('vi-VN'),
      id: item.data._id,
    }));
  }
}

async function updateSupplierData(req, res) {
  try {
    const { id } = req.params;
    const {
      date,
      supplier,
      dryQuantity,
      percentage,
      keQuantity,
      mixedQuantity,
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
          'data.$.dryQuantity': dryQuantity,
          'data.$.percentage': percentage,
          'data.$.keQuantity': keQuantity,
          'data.$.mixedQuantity': mixedQuantity,
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
