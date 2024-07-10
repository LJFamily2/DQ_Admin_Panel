const ProductModel = require('../models/productModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');
const ProductTotalModel = require('../models/productTotalModel');
const formatTotalData = require('./utils/formatTotalData');
const convertToDecimal = require('./utils/convertToDecimal');

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  getProducts,
  renderPage,
};

async function renderPage(req, res) {
  try {
    let totalData = await ProductTotalModel.find();
    const total = formatTotalData(totalData);

    const products = await ProductModel.find({});
    res.render('src/productPage', {
      layout: './layouts/defaultLayout',
      title: 'Quản lý hàng hóa',
      products,
      user: req.user,
      total,
      messages: req.flash(),
    });
  } catch {
    res.status(500).render('partials/500', {layout: false});
  }
}

async function updateProductTotals(dryRubberAdjustment, productAdjustment) {
  let updateData = {};
  if (dryRubberAdjustment !== 0) {
    updateData.$inc = {
      ...updateData.$inc,
      // Convert to number after using toFixed to ensure it's stored as a float
      dryRubber: dryRubberAdjustment,
    };
  }
  if (productAdjustment !== 0) {
    updateData.$inc = {
      ...updateData.$inc,
      // Convert to number after using toFixed to ensure it's stored as a float
      product: productAdjustment,
    };
  }

  const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });

  return total;
}

async function createProduct(req, res) {
  req.body = trimStringFields(req.body);

  try {
    let date = await ProductModel.findOne({ date: req.body.date });
    if (date) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Đã có dữ liệu ngày này. Hãy chọn ngày khác!',
        req.headers.referer,
      );
    }

    // Ensure quantity and dryRubberUsed are defined, else default to "0"
    let quantityStr = req.body.quantity
      ? convertToDecimal(req.body.quantity)
      : 0;
    let dryRubberUsedStr = req.body.dryRubberUsed
      ? convertToDecimal(req.body.dryRubberUsed)
      : 0;

    let quantity = quantityStr;
    let dryRubberUsed = dryRubberUsedStr;

    const newProduct = await ProductModel.create({
      ...req.body,
      quantity: quantity,
      dryRubberUsed: dryRubberUsed,
    });
    if (!newProduct) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Thêm hàng hóa thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    // Calculate adjustments
    let dryRubberAdjustment = -dryRubberUsed;
    let productAdjustment = quantity;

    // Update totals
    const total = await updateProductTotals(
      dryRubberAdjustment,
      productAdjustment,
    );
    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật dữ liệu tổng thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    handleResponse(
      req,
      res,
      201,
      'success',
      'Thêm hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch (err) {
    console.log(err);
    res.status(500).render('partials/500', {layout: false});
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    // Convert input values to decimals and trim whitespace
    const dryRubberUsed = convertToDecimal(req.body.dryRubberUsed).trim();
    const quantity = convertToDecimal(req.body.quantity).trim();

    // Prepare the fields to be updated
    const updateFields = {
      date: req.body.date,
      dryRubberUsed: dryRubberUsed,
      quantity: quantity,
      notes: req.body.notes.trim(),
    };

    // Check if the product exists before attempting to update
    const oldData = await ProductModel.findById(id);
    if (!oldData) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Product not found',
        '/quan-ly-hang-hoa',
      );
    }

    // Update the product with new values
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true },
    );
    if (!updatedProduct) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật hàng hóa thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    // Utility function to update totals in the database
    async function updateTotal(dryRubberAdjustment, productAdjustment) {
      let updateData = {};
      if (dryRubberAdjustment !== 0) {
        updateData.$inc = {
          ...updateData.$inc,
          dryRubber: dryRubberAdjustment,
        };
      }
      if (productAdjustment !== 0) {
        updateData.$inc = {
          ...updateData.$inc,
          product: productAdjustment,
        };
      }

      // Update the totals in the database
      return await ProductTotalModel.findOneAndUpdate({}, updateData, {
        new: true,
        upsert: true,
      });
    }

    // Update totals if there are changes in dryRubberUsed or quantity
    if (dryRubberUsed > 0 || quantity > 0) {
      const total = await updateTotal(-dryRubberUsed, quantity);
      if (!total) {
        return handleResponse(
          req,
          res,
          404,
          'fail',
          'Cập nhật dữ liệu tổng thất bại',
          '/quan-ly-hang-hoa',
        );
      }
    }

    // Respond with success message
    handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhật hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch (error) {
    // Handle any errors that occur during the update process
    res.status(500).render('partials/500', {layout: false});
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không tìm thấy hàng hóa trong cơ sở dữ liệu',
        req.headers.referer,
      );
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa hàng hóa thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    let dryRubberAdjustment = deletedProduct.dryRubberUsed;
    let productAdjustment = -deletedProduct.quantity;

    // Update totals
    const total = await updateProductTotals(
      dryRubberAdjustment,
      productAdjustment,
    );
    if (!total) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhật dữ liệu tổng thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch {
    res.status(500).render('partials/500', {layout: false});
  }
}

async function deleteAllProducts(req, res) {
  try {
    await ProductModel.deleteMany({});
    return handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch {
    res.status(500).render('partials/500', {layout: false});
  }
}

async function getProducts(req, res) {
  try {
    const {
      draw,
      start = 0,
      length = 10,
      search,
      order,
      columns,
      startDate,
      endDate,
    } = req.body;

    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const searchQuery = searchValue
      ? {
          $or: [
            { code: { $regex: searchValue, $options: 'i' } },
            { status: { $regex: searchValue, $options: 'i' } },
            { notes: { $regex: searchValue, $options: 'i' } },
          ],
        }
      : {};

    let filter = { ...searchQuery };

    if (startDate || endDate) {
      filter.date = {};
    
      const filterStartDate = new Date(startDate || endDate);
      filterStartDate.setHours(0, 0, 0, 0);
      filter.date.$gte = filterStartDate;
    
      const filterEndDate = new Date(endDate || startDate);
      filterEndDate.setHours(23, 59, 59, 999);
      filter.date.$lte = filterEndDate;
    }

    // Determine if the sort column is 'date'
    const isSortingByDate = sortColumn === 'date';

    const sortObject = isSortingByDate
      ? { [sortColumn]: sortDirection }
      : { date: -1 };

    const totalRecords = await ProductModel.countDocuments();
    const filteredRecords = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .sort(sortObject)
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10));

    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: product.date.toLocaleDateString(),
      dryRubberUsed: product.dryRubberUsed.toLocaleString('vi-VN') || 0,
      quantity: product.quantity.toLocaleString('vi-VN') || 0,
      notes: product.notes || '',
      id: product._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch {
    res.status(500).render('partials/500', {layout: false});
  }
}
