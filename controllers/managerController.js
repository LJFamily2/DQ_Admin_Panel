const ManagerModel = require("../models/managerModel");
const handleResponse = require("./utils/handleResponse");
const deleteImageFile = require("./utils/deleteImageFile")
const PlantationModel = require("../models/plantationModel");

module.exports = {
  createManager,
  updateManager,
  deleteManager,
  deleteAllManagers,
  getManagers,
  renderPage,
};


async function renderPage(req, res) {
  try {
    const plantations = await PlantationModel.find({});
    const managers = await ManagerModel.find({}).populate("plantations").exec();
    res.render("src/managerPage", {
      layout: "./layouts/defaultLayout",
      managers,
      plantations,
      messages: req.flash(),
      title: "Người quản lý",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createManager(req, res) {
  console.log("Form data:", req.body);
  console.log("Files:", req.files);
  try {
    const frontIdentification = req.files["frontIdentification"]
      ? req.files["frontIdentification"][0].filename
      : null;
    const backIdentification = req.files["backIdentification"]
      ? req.files["backIdentification"][0].filename
      : null;

    const newManager = await ManagerModel.create({
      ...req.body,
      plantation: req.body.plantation || null,
      frontIdentification,
      backIdentification,
    });

    if (!newManager) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo người quản lý thất bại",
        "/quan-ly-nguoi-quan-ly"
      );
    } else {
      handleResponse(
        req,
        res,
        201,
        "success",
        "Tạo người quản lý thành công",
        "/quan-ly-nguoi-quan-ly"
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function updateManager(req, res) {
  console.log(req.body);

  try {
    const { id } = req.params;
    const manager = await ManagerModel.findById(id);

    if (!manager) {
      req.flash("rejected", "Manager not found!");
      return res.redirect("/quan-ly-nguoi-quan-ly");
    }

    // Update basic fields
    const updateFields = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      plantation: req.body.plantation || null,
    };

    // Helper function to handle image field updates
    const updateImageField = async (imageField, newImageField) => {
      if (req.files[newImageField] && req.files[newImageField].length > 0) {
        // Check if the old image exists and delete it
        if (manager[imageField]) {
          try {
            await deleteImageFile(manager[imageField]);
            console.log(`Deleted old image: ${manager[imageField]}`);
          } catch (err) {
            console.error(
              `Error deleting old image ${manager[imageField]}:`,
              err
            );
          }
        }
        // Set new image filename
        updateFields[imageField] = req.files[newImageField][0].filename;
      }
    };

    await Promise.all([
      updateImageField("frontIdentification", "newFrontIdentification"),
      updateImageField("backIdentification", "newBackIdentification"),
    ]);

    // Update manager document
    const updatedManager = await ManagerModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedManager) {
      req.flash("rejected", "Manager update failed!");
      return res.redirect("/quan-ly-nguoi-quan-ly");
    }

    req.flash("accepted", "Cập nhật người quản lý thành công");
    res.redirect("/quan-ly-nguoi-quan-ly");
  } catch (error) {
    console.error("Error updating manager:", error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteManager(req, res) {
  try {
    const { id } = req.params;
    const manager = await ManagerModel.findByIdAndDelete(id);

    if (manager) {
      // Call deleteImageFile function to delete associated image files
      await deleteImageFile(manager.frontIdentification);
      await deleteImageFile(manager.backIdentification);
    }

    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa người quản lý thành công",
      "/quan-ly-nguoi-quan-ly"
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteAllManagers(req, res) {
  try {
    const managers = await ManagerModel.find();

    // Delete all manager documents
    await ManagerModel.deleteMany({});

    // Call deleteImageFile function for each manager to delete associated image files
    await Promise.all(
      managers.map(async (manager) => {
        await deleteImageFile(manager.frontIdentification);
        await deleteImageFile(manager.backIdentification);
      })
    );

    handleResponse(
      req,
      res,
      200,
      "success",
      "Đã xóa tất cả người quản lý",
      "/quan-ly-nguoi-quan-ly"
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function getManagers(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    //  Find the ObjectId(s) of the plantation(s) that match the searchValue
    const plantations = await PlantationModel.find({
      name: { $regex: searchValue, $options: "i" },
    });
    const plantationIds = plantations.map((plantation) => plantation._id);

    // Use these ObjectId(s) in your searchQuery
    const searchQuery = searchValue
      ? {
          $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { phone: { $regex: searchValue, $options: "i" } },
            { address: { $regex: searchValue, $options: "i" } },
            { plantations: { $in: plantationIds } },
          ],
        }
      : {};

    const totalRecords = await ManagerModel.countDocuments();
    const filteredRecords = await ManagerModel.countDocuments(searchQuery);
    const managers = await ManagerModel.find(searchQuery)
      .populate("plantations")
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = managers.map((manager, index) => ({
      no: parseInt(start, 10) + index + 1,
      name: manager.name,
      phone: manager.phone ? manager.phone : "",
      address: manager.address ? manager.address : "",
      plantations: manager.plantations.map(p => p.name).join(', ') || "",
      frontIdentification: manager.frontIdentification,
      backIdentification: manager.backIdentification,
      id: manager._id,
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

