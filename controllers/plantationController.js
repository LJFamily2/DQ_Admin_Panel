const PlantationModel = require('../models/plantationModel');
const handleResponse = require('./utils/handleResponse');
const AreaModel = require('../models/areaModel');
const ManagerModel = require('../models/managerModel');
const ProductModel = require('../models/productModel');
const trimStringFields = require('./utils/trimStringFields');
const { default: mongoose } = require('mongoose');

module.exports = {
  // Main page
  createPlantation,
  updatePlantation,
  deletePlantation,
  deleteAllPlantation,
  getPlantations,
  renderPage,

  // Detail page
  renderDetailPage,
  addData,
  getDatas,
};

async function findOrCreate(model, name) {
  if (!name || name.trim() === '') {
    return null;
  }
  let item = await model.findOne({ name });
  if (!item) {
    item = await model.create({ name });
  }
  return item._id;
}

async function createPlantation(req, res) {
  try {
    // Trim all string fields
    req.body = trimStringFields(req.body);
    console.log(req.body);

    // Validate information
    // Check if a plantation with the same code or name already exists
    let query = { name: req.body.name };

    if (req.body.code && req.body.code !== '') {
      query.code = req.body.code;
    }

    const existingPlantation = await PlantationModel.findOne(query);

    if (existingPlantation) {
      return handleResponse(
        req,
        res,
        400,
        'fail',
        'Mã vườn hoặc tên vườn bị trùng với vườn khác!',
        '/quan-ly-vuon',
      );
    }

    // Find or create the area and manager
    let area = await findOrCreate(AreaModel, req.body.areaID);
    let manager = await findOrCreate(ManagerModel, req.body.managerID);
    // End Validate information

    // Prepare the data for the new plantation
    let plantationData = {
      ...req.body,
      areaID: area,
      managerID: manager,
    };

    // Create the new plantation
    const plantation = await PlantationModel.create(plantationData);

    console.log(plantation);
    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo vườn mới thất bại!',
        '/quan-ly-vuon',
      );
    }

    // Add information for other model
    // Add the new plantation's id to the area
    if (area) {
      await AreaModel.findByIdAndUpdate(area._id, {
        $push: { plantations: plantation._id },
      });
    }

    // Add the new plantation's id to the manager
    if (manager) {
      await ManagerModel.findByIdAndUpdate(manager._id, {
        $push: { plantations: plantation._id },
      });
    }
    // End add information for other model

    return handleResponse(
      req,
      res,
      201,
      'success',
      'Tạo vườn mới thành công!',
      '/quan-ly-vuon',
    );
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function updatePlantation(req, res) {
  req.body = trimStringFields(req.body);
  const { id } = req.params;

  console.log(req.body);

  try {
    // Get the plantation first
    const plantation = await PlantationModel.findById(id);
    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy vườn!',
        req.headers.referer,
      );
    }

    // Delete the manager
    if (req.body.deleteManager === 'yes') {
      await ManagerModel.findByIdAndDelete(plantation.managerID);
    }

    // Find or create the area and manager
    let area = await findOrCreate(AreaModel, req.body.newArea);
    let manager = await findOrCreate(ManagerModel, req.body.newManager);

    // If the area has changed, update the areas
    if (String(plantation.areaID) !== String(area._id)) {
      // Remove the plantation from the old area
      await AreaModel.findByIdAndUpdate(plantation.areaID, {
        $pull: { plantations: plantation._id },
      });

      // Add the plantation to the new area
      await AreaModel.findByIdAndUpdate(area._id, {
        $push: { plantations: plantation._id },
      });
    }

    // Update the plantation with the new information
    const updateFields = {
      ...req.body,
      areaID: area,
      managerID: manager,
    };

    // Save the updated plantation
    const updatedPlantation = await PlantationModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true },
    );

    if (!updatedPlantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy vườn!',
        req.headers.referer,
      );
    }

    // linked the new manager to the plantation
    if (req.body.newManager) {
      const managerData = await ManagerModel.findById(manager);
      if (!managerData.plantations.includes(updatedPlantation._id)) {
        await ManagerModel.findByIdAndUpdate(manager, {
          $push: { plantations: updatedPlantation._id },
        });
      }
    }

    // Return the updated plantation
    handleResponse(
      req,
      res,
      200,
      'success',
      'Thay đổi thông tin thành công',
      req.headers.referer,
    );
  } catch (error) {
    console.error(error);
    handleResponse(res, 500, false, 'Internal Server Error');
  }
}

async function deletePlantation(req, res) {
  console.log(req.params);
  console.log(req.body);
  try {
    const plantationId = req.params.id;
    const { deleteManager } = req.body;

    const plantation = await PlantationModel.findById(plantationId);
    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy vườn cần xóa!',
        '/quan-ly-vuon',
      );
    }

    if (deleteManager === 'yes') {
      await ManagerModel.findByIdAndDelete(plantation.managerID);
    }

    await PlantationModel.findByIdAndDelete(plantationId);

    const message =
      deleteManager === 'yes'
        ? 'Xóa vườn và người quản lý thành công!'
        : 'Xóa vườn thành công!';
    return handleResponse(req, res, 200, 'success', message, '/quan-ly-vuon');
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function deleteAllPlantation(req, res) {
  try {
    const { deleteManager } = req.body;

    const plantations = await PlantationModel.find({});

    if (deleteManager === 'yes') {
      const managerIds = plantations.map(plantation => plantation.managerID);
      await ManagerModel.deleteMany({ _id: { $in: managerIds } });
    }

    await PlantationModel.deleteMany({});

    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả vườn và người quản lý thành công!',
      '/quan-ly-vuon',
    );
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function getPlantations(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const [areas, managers] = await Promise.all([
      AreaModel.find({ name: { $regex: searchValue, $options: 'i' } }),
      ManagerModel.find({ name: { $regex: searchValue, $options: 'i' } }),
    ]);

    const searchQuery = searchValue
      ? {
          $or: [
            { name: { $regex: searchValue, $options: 'i' } },
            { code: { $regex: searchValue, $options: 'i' } },
            { plantationArea: { $regex: searchValue, $options: 'i' } },
            { areaID: { $in: areas.map(area => area._id) } },
            { managerID: { $in: managers.map(manager => manager._id) } },
          ],
        }
      : {};

    const [totalRecords, filteredRecords, plantations] = await Promise.all([
      PlantationModel.countDocuments(),
      PlantationModel.countDocuments(searchQuery),
      PlantationModel.find(searchQuery)
        .populate('areaID')
        .populate('managerID')
        .sort({ [sortColumn]: sortDirection })
        .skip(parseInt(start, 10))
        .limit(parseInt(length, 10))
        .exec(),
    ]);

    const data = await Promise.all(
      plantations.map(async (plantation, index) => ({
        no: parseInt(start, 10) + index + 1,
        areaID: plantation.areaID?.name || '',
        code: plantation.code || '',
        name: plantation.name,
        managerID: plantation.managerID?.name || '',
        contactDuration:
          (await plantation.calculateRemainingDays()) || 'Không hợp đồng',
        totalRemainingDays: await plantation.calculateTotalRemainingDays(),
        plantationArea: plantation.plantationArea || '',
        slug: plantation.slug,
        id: plantation._id,
      })),
    );

    if (sortColumn === 'contactDuration') {
      data.sort(
        (a, b) => sortDirection * (a.totalRemainingDays - b.totalRemainingDays),
      );
    }

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (error) {
    console.error('Error handling DataTable request:', error);
    res.status(500).json({ error: error.message });
  }
}
async function renderPage(req, res) {
  try {
    const plantations = await PlantationModel.find({})
      .populate({ path: 'managerID', populate: { path: 'plantations' } })
      .populate('areaID')
      .exec();
    const areas = await AreaModel.find({});
    const managers = await ManagerModel.find({});
    res.render('src/plantationPage', {
      layout: './layouts/defaultLayout',
      title: 'Quản lý vườn',
      plantations,
      managers,
      areas,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function renderDetailPage(req, res) {
  try {
    const { slug } = req.params;
    const plantation = await PlantationModel.findOne({ slug })
      .populate('areaID')
      .populate('managerID')
      .exec();
    const areas = await AreaModel.find({});
    const products = await ProductModel.find({});
    const managers = await ManagerModel.find({});
    if (!plantation) {
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy vườn!',
        '/quan-ly-vuon',
      );
      return res.status(404);
    }
    res.render('src/plantationDetailPage', {
      layout: './layouts/defaultLayout',
      title: `Chi tiết vườn ${plantation.name}`,
      plantation,
      areas,
      products,
      managers,
      messages: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function addData(req, res) {
  req.body = trimStringFields(req.body);

  try {
    const plantation = await PlantationModel.findOne({ slug: req.params.slug });
    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không thể tìm thấy vườn!',
        req.headers.referer,
      );
    }

    // Extract data from request body
    const {
      date,
      note,
      dryRubber,
      dryQuantity,
      dryPercentage,
      mixedRubber,
      mixedQuantity,
      mixedPercentage,
    } = req.body;

    // Convert numeric fields from Vietnamese format to standard JavaScript format
    const formattedDryQuantity = parseFloat(dryQuantity.replace(',', '.'));
    const formattedDryPercentage = parseFloat(dryPercentage.replace(',', '.'));
    const formattedMixedQuantity = parseFloat(mixedQuantity.replace(',', '.'));
    const formattedMixedPercentage = parseFloat(
      mixedPercentage.replace(',', '.'),
    );

    // Create new data object with formatted numbers
    const newData = {
      date,
      notes: note,
      products: {
        dryRubber,
        dryQuantity: formattedDryQuantity,
        dryPercentage: formattedDryPercentage,
        mixedRubber,
        mixedQuantity: formattedMixedQuantity,
        mixedPercentage: formattedMixedPercentage,
      },
    };

    // Push new data to plantation array and save
    plantation.data.push(newData);
    const savedPlantation = await plantation.save();

    if (!savedPlantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Thêm thông tin mới thất bại!',
        req.headers.referer,
      );
    }

    // Successful response
    return handleResponse(
      req,
      res,
      201,
      'success',
      'Thêm thông tin mới thành công!',
      req.headers.referer,
    );
  } catch (error) {
    console.error('Error adding data:', error);
    return res
      .status(500)
      .json({ error: 'Đã xảy ra lỗi khi thêm thông tin mới!' });
  }
}

// Function to format number for display
function formatNumberForDisplay(number) {
  if (isNaN(number) || number === null || number === undefined) {
    return ''; // Return empty string if the number is invalid
  }
  const formatted = number.toFixed(2);
  const [integerPart, decimalPart] = formatted.split('.');
  const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerWithCommas},${decimalPart}`;
}

async function getDatas(req, res) {
  try {
    const { slug } = req.params;
    const { draw, start = 0, length = 10, search, order, columns, startDate, endDate } = req.body;
    const searchValue = search?.value?.toLowerCase() || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    // Fetch the plantation document
    const plantation = await PlantationModel.findOne({ slug });

    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy vườn!',
        req.headers.referer
      );
    }

    // Convert startDate and endDate to Date objects if they exist
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    // Filter data within the plantation details
    let filteredData = plantation.data.filter(item => {
      // Check if the item date is within the specified range
      const itemDate = new Date(item.date);
      if (startDateObj && itemDate < startDateObj) return false;
      if (endDateObj && itemDate > endDateObj) return false;

      // Check if any column contains the search value
      for (let column of columns) {
        const columnValue = item[column.data]?.toString().toLowerCase();
        if (columnValue && columnValue.includes(searchValue)) {
          return true;
        }
      }
      return false;
    });

    // Sorting logic
    filteredData.sort((a, b) => {
      // Sort by date if requested, default to no sorting on date
      if (sortColumn === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return (dateA - dateB) * sortDirection;
      }

      // Handle sorting based on the sortColumn if specified
      if (sortColumn) {
        const aValue = a[sortColumn]?.toString().toLowerCase() || '';
        const bValue = b[sortColumn]?.toString().toLowerCase() || '';

        // Custom sorting for dryTotal and mixedTotal
        if (sortColumn === 'dryTotal' || sortColumn === 'mixedTotal') {
          const aValueNumeric =
            (a.products?.dryQuantity * a.products?.dryPercentage) / 100 || 0;
          const bValueNumeric =
            (b.products?.dryQuantity * b.products?.dryPercentage) / 100 || 0;

          return (aValueNumeric - bValueNumeric) * sortDirection;
        }

        // Default sorting
        return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * sortDirection;
      }

      // No specific sorting requested, maintain the order
      return 0;
    });

    // Calculate total records and filtered records
    const recordsTotal = plantation.data.length;
    const recordsFiltered = filteredData.length;

    // Paginate the filtered data
    const paginatedData = filteredData.slice(start, start + length);

    // Map data to the required format for response
    const data = paginatedData.map((record, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: record.date.toLocaleDateString(),
      dryQuantity: formatNumberForDisplay(record.products?.dryQuantity || 0),
      dryPercentage: formatNumberForDisplay(record.products?.dryPercentage || 0),
      dryTotal: formatNumberForDisplay(
        (record.products?.dryQuantity * record.products?.dryPercentage) / 100 || 0
      ),
      mixedQuantity: formatNumberForDisplay(record.products?.mixedQuantity || 0),
      mixedPercentage: formatNumberForDisplay(record.products?.mixedPercentage || 0),
      mixedTotal: formatNumberForDisplay(
        (record.products?.mixedQuantity * record.products?.mixedPercentage) / 100 || 0
      ),
      notes: record.notes || '',
      id: record._id,
    }));

    // Respond with formatted data
    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data,
    });
  } catch (error) {
    console.error('Error in getDatas:', error);
    res.status(500).json({ error: error.message });
  }
}




