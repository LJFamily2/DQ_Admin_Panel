const AreaModel = require("../models/areaModel");
const handleResponse = require("./utils/handleResponse");
const PlantationModel = require("../models/plantationModel");

async function renderPage(req, res) {
  try {
    const plantations = await PlantationModel.find({});
    const areas = await AreaModel.find({}).populate("plantations").exec();
    res.render("src/areaPage", {
      layout: "./layouts/defaultLayout",
      title: "Quản lý khu vực",
      areas,
      plantations,
      messages: req.flash(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createArea(req, res) {
  try {
    const { name, plantation } = req.body;

    let checkExist = await AreaModel.findOne({ name: name });

    if (checkExist) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Khu vực đã tồn tại",
        "/quan-ly-khu-vuc"
      );
    }

    // Ensure plantation is an array
    let plantationArray = Array.isArray(plantation) ? plantation : [plantation];

    // Remove empty or whitespace-only strings
    plantationArray = plantationArray.filter((p) => p && p.trim() !== "");

    // Remove duplicates
    plantationArray = [...new Set(plantationArray)];

    const plantationPromises = plantationArray.map(async (p) => {
      const { _id } = await PlantationModel.findOneOrCreate({ name: p });

      // Find and update the area that currently has the plantation
      await AreaModel.findOneAndUpdate(
        { plantations: _id },
        { $pull: { plantations: _id } }
      );

      return _id;
    });

    const plantationIds = await Promise.all(plantationPromises);

    const newArea = await AreaModel.create({
      name,
      plantations: plantationIds,
    });

    if (!newArea) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Thêm khu vực thất bại",
        "/quan-ly-khu-vuc"
      );
    }

    return handleResponse(
      req,
      res,
      201,
      "success",
      "Thêm khu vực thành công",
      "/quan-ly-khu-vuc"
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

PlantationModel.findOneOrCreate = async function findOneOrCreate(condition) {
  const self = this;
  let result = await self.findOne(condition);
  if (result) {
    return result;
  }
  result = new self(condition);
  return await result.save();
};

async function updateArea(req, res) {
  try {
    console.log(req.body);
    const id = req.params.id;
    const { name, unit } = req.body;
    const updateFields = {
      name,
      unit,
    };
    const updatedArea = await AreaModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedArea) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật khu vực thất bại",
        "/quan-ly-hang-hoa"
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật khu vực thành công",
      "/quan-ly-hang-hoa"
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteArea(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy khu vực trong cơ sở dữ liệu",
        "/quan-ly-hang-hoa"
      );
    }

    const deletedArea = await AreaModel.findByIdAndDelete(id);

    if (!deletedArea) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa khu vực thất bại",
        "/quan-ly-hang-hoa"
      );
    }
    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa khu vực thành công",
      "/quan-ly-hang-hoa"
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteAllAreas(req, res) {
  try {
    await AreaModel.deleteMany({});
    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả khu vực thành công",
      "/quan-ly-hang-hoa"
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getArea(req, res) {
  var areaId = req.params.id;
  var areaData = await AreaModel.findById(areaId)
    .populate("plantations")
    .exec();
  res.json(areaData);
}

async function getAreas(req, res) {
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

    const totalRecords = await AreaModel.countDocuments();
    const filteredRecords = await AreaModel.countDocuments(searchQuery);
    const products = await AreaModel.find(searchQuery)
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

module.exports = {
  createArea,
  updateArea,
  deleteArea,
  deleteAllAreas,
  getArea,
  getAreas,
  renderPage,
};
