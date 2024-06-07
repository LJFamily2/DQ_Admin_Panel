const PlantationModel = require("../models/plantationModel");
const handleResponse = require("./utils/handleResponse");
const AreaModel = require("../models/areaModel");
const ManagerModel = require("../models/managerModel");
module.exports = {
  createPlantation,
  //   updateProduct,
  //   deleteProduct,
  //   deleteAllProducts,
  getPlantations,
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

async function getPlantations(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    //  Find the ObjectId(s) of the area(s) that match the searchValue
    const areas = await AreaModel.find({
      name: { $regex: searchValue, $options: "i" },
    });
    const areaID = areas.map((area) => area._id);
    //  Find the ObjectId(s) of the manager(s) that match the searchValue
    const managers = await ManagerModel.find({
      name: { $regex: searchValue, $options: "i" },
    });
    const managerID = managers.map((manager) => manager._id);

    // Use these ObjectId(s) in your searchQuery
    const searchQuery = searchValue
      ? {
          $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { code: { $regex: searchValue, $options: "i" } },
            { plantationArea: { $regex: searchValue, $options: "i" } },
            { areaID: { $in: areaID } },
            { managerID: { $in: managerID } },
          ],
        }
      : {};

    const totalRecords = await PlantationModel.countDocuments();
    const filteredRecords = await PlantationModel.countDocuments(searchQuery);
    const plantations = await PlantationModel.find(searchQuery)
      .populate("areaID")
      .populate("managerID")
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = await Promise.all(
      plantations.map(async (plantation, index) => {
        const remainingDays = await plantation.calculateRemainingDays();
        return {
          no: parseInt(start, 10) + index + 1,
          areaID: plantation.areaID ? plantation.areaID.name : "",
          code: plantation.code ? plantation.code : "",
          name: plantation.name ? plantation.name : "",
          managerID: plantation.managerID ? plantation.managerID.name : "",
          contactDuration: remainingDays ? remainingDays : "Không hợp đồng",
          plantationArea: plantation.plantationArea
            ? plantation.plantationArea
            : "",
          slug: plantation.slug ? plantation.slug : "",
          id: plantation._id,
        };
      })
    );

    // If sortColumn is 'contactDuration', sort data by 'contactDuration'
    if (sortColumn === "contactDuration") {
      data.sort(
        (a, b) =>
          sortDirection * a.contactDuration.localeCompare(b.contactDuration)
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
