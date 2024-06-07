const ProductModel = require("../models/productModel");
const handleResponse = require("./utils/handleResponse");

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
    const products = await ProductModel.find({});
    res.render("src/productPage", {
      layout: "./layouts/defaultLayout",
      title: "Quản lý hàng hóa",
      products,
      messages: req.flash(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    console.log(req.body)
    const { name, unit } = req.body;

    const newProduct = await ProductModel.create({ name, unit });
    if (!newProduct) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Thêm hàng hóa thất bại",
        "/quan-ly-hang-hoa"
      );
    }
    handleResponse(
      req,
      res,
      201,
      "success",
      "Thêm hàng hóa thành công",
      "/quan-ly-hang-hoa"
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    console.log(req.body)
    const id = req.params.id;
    const { name, unit } = req.body;
    const updateFields ={
        name,
        unit
    }
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedProduct) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật hàng hóa thất bại",
        "/quan-ly-hang-hoa"
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật hàng hóa thành công",
      "/quan-ly-hang-hoa"
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
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy hàng hóa trong cơ sở dữ liệu",
        "/quan-ly-hang-hoa"
      );
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa hàng hóa thất bại",
        "/quan-ly-hang-hoa"
      );
    }
    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa hàng hóa thành công",
      "/quan-ly-hang-hoa"
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteAllProducts(req, res) {
  try {
    await ProductModel.deleteMany({});
    handleResponse(
        req,
        res,
        200,
        "success",
        "Xóa tất cả hàng hóa thành công",
        "/quan-ly-hang-hoa"
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getProducts(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    // Use these ObjectId(s) in your searchQuery
    const searchQuery = searchValue
      ? {
          $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { unit: { $regex: searchValue, $options: "i" } },
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
      name: product.name,
      unit: product.unit,
      id: product._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (error) {
    console.error("Error handling DataTable request:", error);
    res.status(500).json({ error: error.message });
  }
}
