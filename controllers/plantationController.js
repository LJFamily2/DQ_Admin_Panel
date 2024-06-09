const PlantationModel = require("../models/plantationModel");
const handleResponse = require("./utils/handleResponse");
const AreaModel = require("../models/areaModel");
const ManagerModel = require("../models/managerModel");
module.exports = {
  createPlantation,
  //   updateProduct,
  deletePlantation,
  deleteAllPlantation,
  getPlantations,
  renderPage,
};

async function createPlantation(req, res) {
  try {
    console.log(req.body);

    // Validate information
    // Check if a plantation with the same code or name already exists
    const existingPlantation = await PlantationModel.findOne({
      $or: [{ code: req.body.code }, { name: req.body.name }],
    });

    if (existingPlantation) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Mã vườn hoặc tên vườn bị trùng với vườn khác!",
        "/quan-ly-vuon"
      );
    }

    // Find or create the area and manager
    let area =
      (await AreaModel.findOne({ name: req.body.areaID })) ||
      (await AreaModel.create({ name: req.body.areaID }));
    let manager =
      (await ManagerModel.findOne({ name: req.body.managerID })) ||
      (await ManagerModel.create({ name: req.body.managerID }));
    // End Validate information

    // Create the new plantation
    const plantation = await PlantationModel.create({
      ...req.body,
      areaID: area._id,
      managerID: manager._id,
    });

    console.log(plantation);
    if (!plantation) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo vườn mới thất bại!",
        "/quan-ly-vuon"
      );
    }

    // Add information for other model
    // Add the new plantation's id to the area
    await AreaModel.findByIdAndUpdate(area._id, {
      $push: { plantations: plantation._id },
    });

    // Add the new plantation's id to the manager
    await ManagerModel.findByIdAndUpdate(manager._id, {
      $push: { plantations: plantation._id },
    });
    // End add information for other model

    return handleResponse(
      req,
      res,
      201,
      "success",
      "Tạo vườn mới thành công!",
      "/quan-ly-vuon"
    );
  } catch (err) {
    console.log(err);
    res.status(500);
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
        "fail",
        "Không tìm thấy vườn cần xóa!",
        "/quan-ly-vuon"
      );
    }

    if (deleteManager === "yes") {
      await ManagerModel.findByIdAndDelete(plantation.managerID);
    }

    await PlantationModel.findByIdAndDelete(plantationId);

    const message =
      deleteManager === "yes"
        ? "Xóa vườn và người quản lý thành công!"
        : "Xóa vườn thành công!";
    return handleResponse(req, res, 200, "success", message, "/quan-ly-vuon");
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function deleteAllPlantation(req, res) {
  try {
    const { deleteManager } = req.body;

    const plantations = await PlantationModel.find({});

    if (deleteManager === "yes") {
      const managerIds = plantations.map((plantation) => plantation.managerID);
      await ManagerModel.deleteMany({ _id: { $in: managerIds } });
    }

    await PlantationModel.deleteMany({});

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả vườn và người quản lý thành công!",
      "/quan-ly-vuon"
    );
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function getPlantations(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    const [areas, managers] = await Promise.all([
      AreaModel.find({ name: { $regex: searchValue, $options: "i" } }),
      ManagerModel.find({ name: { $regex: searchValue, $options: "i" } }),
    ]);

    const searchQuery = searchValue
      ? {
          $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { code: { $regex: searchValue, $options: "i" } },
            { plantationArea: { $regex: searchValue, $options: "i" } },
            { areaID: { $in: areas.map((area) => area._id) } },
            { managerID: { $in: managers.map((manager) => manager._id) } },
          ],
        }
      : {};

    const [totalRecords, filteredRecords, plantations] = await Promise.all([
      PlantationModel.countDocuments(),
      PlantationModel.countDocuments(searchQuery),
      PlantationModel.find(searchQuery)
        .populate("areaID")
        .populate("managerID")
        .sort({ [sortColumn]: sortDirection })
        .skip(parseInt(start, 10))
        .limit(parseInt(length, 10))
        .exec(),
    ]);

    const data = await Promise.all(
      plantations.map(async (plantation, index) => ({
        no: parseInt(start, 10) + index + 1,
        areaID: plantation.areaID?.name || "",
        code: plantation.code,
        name: plantation.name,
        managerID: plantation.managerID?.name || "",
        contactDuration:
          (await plantation.calculateRemainingDays()) || "Không hợp đồng",
        totalRemainingDays: await plantation.calculateTotalRemainingDays(),
        plantationArea: plantation.plantationArea,
        slug: plantation.slug,
        id: plantation._id,
      }))
    );

    if (sortColumn === "contactDuration") {
      data.sort(
        (a, b) => sortDirection * (a.totalRemainingDays - b.totalRemainingDays)
      );
    }

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
async function renderPage(req, res) {
  try {
    const plantations = await PlantationModel.find({});
    const areas = await AreaModel.find({});
    const managers = await ManagerModel.find({});
    res.render("src/plantationPage", {
      layout: "./layouts/defaultLayout",
      title: "Quản lý vườn",
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
