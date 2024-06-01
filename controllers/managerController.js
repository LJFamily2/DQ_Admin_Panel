const fs = require('fs');
const path = require('path');
const ManagerModel = require("../models/managerModel");
const handleResponse = require("./utils/handleResponse");

async function renderPage(req, res) {
  try {
    const managers = await ManagerModel.find({}).populate('plantation').exec();
    res.render("src/managerPage", {
      layout: "./layouts/defaultLayout",
      managers,
      messages: req.flash(),
      title: "Người quản lý",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createManager(req, res) {
  try {
    const frontIdentification = req.files["frontIdentification"]
      ? req.files["frontIdentification"][0].filename
      : null;
    const backIdentification = req.files["backIdentification"]
      ? req.files["backIdentification"][0].filename
      : null;

    const newManager = await ManagerModel.create({
      ...req.body,
      frontIdentification,
      backIdentification,
    });

    if (!newManager) {
      handleResponse(req, res, 404, "fail", "Tạo người quản lý thất bại", "/quan-ly-nguoi-quan-ly");
    } else {
      handleResponse(req, res, 201, "success", "Tạo người quản lý thành công", "/quan-ly-nguoi-quan-ly");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function updateManager(req, res) {
  try {
    const { id } = req.params;
    const manager = await ManagerModel.findById(id);

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const frontIdentification = req.files["frontIdentification"]
      ? req.files["frontIdentification"][0].filename
      : manager.frontIdentification;
    const backIdentification = req.files["backIdentification"]
      ? req.files["backIdentification"][0].filename
      : manager.backIdentification;

    if (req.files["frontIdentification"] && manager.frontIdentification) {
      fs.unlink(path.join(__dirname, '../uploads/', manager.frontIdentification), (err) => {
        if (err) console.error(err);
      });
    }
    if (req.files["backIdentification"] && manager.backIdentification) {
      fs.unlink(path.join(__dirname, '../uploads/', manager.backIdentification), (err) => {
        if (err) console.error(err);
      });
    }

    manager.name = req.body.name;
    manager.phone = req.body.phone;
    manager.address = req.body.address;
    manager.plantation = req.body.plantation;
    manager.frontIdentification = frontIdentification;
    manager.backIdentification = backIdentification;

    await manager.save();

    handleResponse(req, res, 200, "success", "Cập nhật người quản lý thành công", "/quan-ly-nguoi-quan-ly");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteManager(req, res) {
  try {
    const { id } = req.params;
    const manager = await ManagerModel.findByIdAndDelete(id);

    if (manager) {
      if (manager.frontIdentification) {
        fs.unlink(path.join(__dirname, '../uploads/', manager.frontIdentification), (err) => {
          if (err) console.error(err);
        });
      }
      if (manager.backIdentification) {
        fs.unlink(path.join(__dirname, '../uploads/', manager.backIdentification), (err) => {
          if (err) console.error(err);
        });
      }
    }

    handleResponse(req, res, 200, "success", "Xóa người quản lý thành công", "/quan-ly-nguoi-quan-ly");
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

    // Delete associated files
    managers.forEach(manager => {
      if (manager.frontIdentification) {
        fs.unlink(path.join(__dirname, '../uploads/', manager.frontIdentification), (err) => {
          if (err) console.error(err);
        });
      }
      if (manager.backIdentification) {
        fs.unlink(path.join(__dirname, '../uploads/', manager.backIdentification), (err) => {
          if (err) console.error(err);
        });
      }
    });

    handleResponse(req, res, 200, "success", "Đã xóa tất cả người quản lý", "/quan-ly-nguoi-quan-ly");
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

    const searchQuery = {
      ...(searchValue && { name: { $regex: searchValue, $options: "i" } }),
      ...(searchValue && { phone: { $regex: searchValue, $options: "i" } }),
      ...(searchValue && { address: { $regex: searchValue, $options: "i" } }),
      ...(searchValue && { plantation: { $regex: searchValue, $options: "i" } }),
    };

    const totalRecords = await ManagerModel.countDocuments();
    const filteredRecords = await ManagerModel.countDocuments(searchQuery);
    const managers = await ManagerModel.find(searchQuery)
      .populate('plantation')
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = managers.map((manager, index) => ({
      no: parseInt(start, 10) + index + 1,
      name: manager.name,
      phone: manager.phone,
      address: manager.address,
      plantation: manager.plantation.name, // Ensure plantation name is displayed
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

module.exports = {
  createManager,
  updateManager,
  deleteManager,
  deleteAllManagers,
  getManagers,
  renderPage,
};
