const AreaModel = require("../models/areaModel");
const handleResponse = require("./utils/handleResponse");
const PlantationModel = require("../models/plantationModel");
const trimStringFields = require("./utils/trimStringFields");

module.exports = {
  createArea,
  updateArea,
  removePlantationFromArea,
  deleteAreas,
  deleteAllAreas,
  getArea,
  getAreas,
  renderPage,
};

async function renderPage(req, res) {
  try {
    const plantations = await PlantationModel.find({});
    const areas = await AreaModel.find({}).populate("plantations").exec();

    res.render("src/areaPage", {
      layout: "./layouts/defaultLayout",
      title: "Quản lý vườn",
      areas,
      plantations,
      messages: req.flash(),
    });
  } catch (err) {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function createArea(req, res) {
  try {
    req.body = trimStringFields(req.body);

    let checkExist = await AreaModel.findOne({ name: req.body.name });

    if (checkExist) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Vườn đã tồn tại",
        "/quan-ly-khu-vuc"
      );
    }

    // Ensure plantation is an array
    let plantationArray = Array.isArray(req.body.plantation)
      ? req.body.plantation
      : [req.body.plantation];

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
      name: req.body.name,
      plantations: plantationIds,
    });

    if (!newArea) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Thêm vườn thất bại",
        "/quan-ly-khu-vuc"
      );
    }

    return handleResponse(
      req,
      res,
      201,
      "success",
      "Thêm vườn thành công",
      "/quan-ly-khu-vuc"
    );
  } catch {
    return res.status(500).render("partials/500", { layout: false });
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
    req.body = trimStringFields(req.body);

    const updateFields = {
      name: req.body.name,
    };
    const updatedArea = await AreaModel.findByIdAndUpdate(
      req.body.area,
      updateFields,
      {
        new: true,
      }
    );

    if (!updatedArea) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật vườn thất bại",
        "/quan-ly-khu-vuc"
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhật vườn thành công",
      "/quan-ly-khu-vuc"
    );
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function removePlantationFromArea(req, res) {
  const { areaId, plantationId } = req.body;

  try {
    const updatedArea = await AreaModel.findByIdAndUpdate(
      areaId,
      { $pull: { plantations: plantationId } },
      { new: true }
    );

    if (!updatedArea) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Vườn đã tồn tại",
        "/quan-ly-khu-vuc"
      );
    }

    if (!updatedArea.plantations.includes(plantationId)) {
      return handleResponse(
        req,
        res,
        200,
        "success",
        "Xóa vườn khỏi vườn thành công",
        "/quan-ly-khu-vuc"
      );
    } else {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy vườn trong vườn này",
        "/quan-ly-khu-vuc"
      );
    }
  } catch (err) {
    console.error(err);
    return res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteAreas(req, res) {
  try {
    let { areaID } = req.body;
    areaID = [].concat(areaID);

    if (!areaID) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không tìm thấy vườn để xóa",
        "/quan-ly-khu-vuc"
      );
    }

    const deleteResults = await Promise.all(
      areaID.map((areaId) => AreaModel.findByIdAndDelete(areaId))
    );

    if (deleteResults.some((result) => result == null)) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Xóa một hoặc nhiều vườn thất bại",
        "/quan-ly-khu-vuc"
      );
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa vườn thành công",
      "/quan-ly-khu-vuc"
    );
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteAllAreas(req, res) {
  try {
    await AreaModel.deleteMany({});
    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả vườn thành công",
      "/quan-ly-khu-vuc"
    );
  } catch {
    res.status(500).render("partials/500", { layout: false });
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
