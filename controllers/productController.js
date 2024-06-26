const ProductModel = require('../models/productModel');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');
const ProductTotalModel = require('../models/productTotalModel');
const formatTotalData = require('./utils/formatTotalData');


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
    const total = formatTotalData(totalData)

    const products = await ProductModel.find({});
    res.render('src/productPage', {
      layout: './layouts/defaultLayout',
      title: 'Quản lý hàng hóa',
      products,
      total,
      messages: req.flash(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createProduct(req, res) {
  console.log(req.body);
  req.body = trimStringFields(req.body);

  try {
    // Ensure quantity and dryRubberUsed are defined, else default to "0"
    let quantityStr = req.body.quantity ? req.body.quantity.replace(",", ".") : "0";
    let dryRubberUsedStr = req.body.dryRubberUsed ? req.body.dryRubberUsed.replace(",", ".") : "0";

    let quantity = parseFloat(quantityStr);
    let dryRubberUsed = parseFloat(dryRubberUsedStr);
    
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

    console.log(newProduct);

    let updateData = {};
    if (dryRubberUsed > 0) {
      updateData.$inc = { ...updateData.$inc, dryRubber: -dryRubberUsed };
    }
    if (quantity > 0) {
      updateData.$inc = { ...updateData.$inc, product: quantity };
    }

    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  console.log(req.body);
  req.body = trimStringFields(req.body);
  try {
    const {id} =req.params;
    
    const updateFields = {
      date: req.body.date,
      dryRubberUsed: req.body.dryRubberUsed,
      quantity: req.body.quantity,
      notes: req.body.notes,
    };
    
    const oldData = await ProductModel.findById(id);
    
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

    console.log(updatedProduct);


    let updateData = {};

    let dryRubberUsedDiff = updatedProduct.dryRubberUsed - oldData.dryRubberUsed
    let quantityDiff = updatedProduct.quantity - oldData.quantity
    console.log(updatedProduct.dryRubberUsed)
    console.log(oldData.dryRubberUsed)
    console.log(dryRubberUsedDiff , quantityDiff)
  
    if (dryRubberUsedDiff !== 0) {
      updateData.$inc = { ...updateData.$inc, dryRubber: -dryRubberUsedDiff };
    }
    if (quantityDiff !== 0) {
      updateData.$inc = { ...updateData.$inc, product: quantityDiff };
    }


    const total = await ProductTotalModel.findOneAndUpdate({}, updateData, {new:true, upsert: true})

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
      'Cập nhật hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
      handleResponse(
        req,
        res,
        404,
        'fail',
        'Xóa hàng hóa thất bại',
        '/quan-ly-hang-hoa',
      );
    }

    let updateData = {};
    if (deletedProduct.dryRubberUsed > 0) {
      updateData.$inc = { ...updateData.$inc, dryRubber: deletedProduct.dryRubberUsed };
    }
    if (deletedProduct.quantity > 0) {
      updateData.$inc = { ...updateData.$inc, product: -deletedProduct.quantity };
    }

    const total = await ProductTotalModel.findOneAndUpdate
      ({}, updateData, {new:true, upsert: true})

    if(!total){
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
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

async function deleteAllProducts(req, res) {
  try {
    await ProductModel.deleteMany({});
    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả hàng hóa thành công',
      '/quan-ly-hang-hoa',
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getProducts(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    // Use these ObjectId(s) in your searchQuery
    const searchQuery = searchValue
      ? {
          $or: [
            { date: { $regex: searchValue, $options: 'i' } },
            { quantity: { $regex: searchValue, $options: 'i' } },
            { dryRubberUsed: { $regex: searchValue, $options: 'i' } },
            { notes: { $regex: searchValue, $options: 'i' } },
          ],
        }
      : {};

    const totalRecords = await ProductModel.countDocuments();
    const filteredRecords = await ProductModel.countDocuments(searchQuery);
    const products = await ProductModel.find(searchQuery)
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = products.map((product, index) => ({
      no: parseInt(start, 10) + index + 1,
      date: product.date.toLocaleDateString(),
      dryRubberUsed: product.dryRubberUsed,
      quantity: product.quantity || 0,
      notes: product.notes || '',
      id: product._id,
    }));

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
