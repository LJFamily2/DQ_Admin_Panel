const PlantationModel = require("../models/plantationModel");
const handleResponse = require("./utils/handleResponse");
const AreaModel = require("../models/areaModel");
const ManagerModel = require("../models/managerModel");
module.exports = {
  createPlantation,
  //   updateProduct,
  //   deleteProduct,
  //   deleteAllProducts,
  //   getProducts,
  renderPage,
};

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

async function createPlantation(req, res) {
  try {
    console.log(req.body);

    let code = req.body.code;
    let name = req.body.name;
    let areaName = req.body.areaID;
    let managerName = req.body.managerID;

    // Check if a plantation with the same code or name already exists
    const existingPlantationWithSameCode = await PlantationModel.findOne({
      code: code,
    });
    if (existingPlantationWithSameCode) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Mã vườn bị trùng với vườn khác!",
        "/quan-ly-vuon"
      );
    }

    const existingPlantationWithSameName = await PlantationModel.findOne({
      name: name,
    });
    if (existingPlantationWithSameName) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        "Tên vườn bị trùng với vườn khác!",
        "/quan-ly-vuon"
      );
    }

    // Find or create the area and manager
    let area = await AreaModel.findOne({ name: areaName });
    if (!area) {
      area = await AreaModel.create({ name: areaName });
    }

    let manager = await ManagerModel.findOne({ name: managerName });
    if (!manager) {
      manager = await ManagerModel.create({ name: managerName });
    }

    // Add the ids of the area and manager to the request body
    req.body.areaID = area._id;
    req.body.managerID = manager._id;

    const plantation = await PlantationModel.create(req.body);
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

    // Add the new plantation's id to the area
    await AreaModel.findByIdAndUpdate(area._id, {
      $push: { plantations: plantation._id },
    });

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
