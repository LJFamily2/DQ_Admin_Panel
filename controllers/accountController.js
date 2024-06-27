const UserModel = require("../models/userAccountModel");
const bcrypt = require("bcrypt");
const handleResponse = require("./utils/handleResponse");
const trimStringFields = require('./utils/trimStringFields')

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  logOut,
  renderPage,
  deleteAllUsers,
};

async function renderPage(req, res) {
  try {
    const users = await UserModel.find({ role: false });
    res.render("src/accountPage", {
      layout: "./layouts/defaultLayout",
      users,
      messages: req.flash(),
      title: "Quản lý tài khoản",
    });
  } catch {
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  console.log(req.body)
  req.body = trimStringFields(req.body);
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await UserModel.create({
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
    });
    if (!user) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo tài khoản thất bại",
        "/quan-ly-tai-khoan"
      );
    }

    console.log(user)

    handleResponse(
      req,
      res,
      201,
      "success",
      "Tạo tài khoản thành công",
      "/quan-ly-tai-khoan"
    );
  } catch (error) {
    res.status(500);
  }
}

async function getUsers(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    const searchQuery = {
      role: false,
      ...(searchValue && { username: { $regex: searchValue, $options: "i" } }),
    };

    const totalRecords = await UserModel.countDocuments({ role: false });
    const filteredRecords = await UserModel.countDocuments(searchQuery);
    const users = await UserModel.find(searchQuery)
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10))
      .exec();

    const data = users.map((user, index) => ({
      no: parseInt(start, 10) + index + 1,
      username: user.username,
      password: "**********",
      id: user._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (error) {
    console.error("Error handling DataTable request:", error);
    res.status(500);
  }
}

async function updateUser(req, res) {
  console.log(req.body)
  req.body = trimStringFields(req.body);
  try {
    if (!user) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không thấy tài khoản",
        "/quan-ly-tai-khoan"
      );
    }

    const updateFields = {
      username: req.body.username,
      role: req.body.role,
      password: req.body.password,
    };
    if (req.body.password) {
      updateFields.password = await bcrypt.hash(req.body.password, 10);
    }

    const newUser = await UserModel.findByIdAndUpdate(req.params.id, updateFields, {new:true})

    if (!newUser) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhập tài khoản thất bại",
        "/quan-ly-tai-khoan"
      );
    }

    console.log(newUser)

    handleResponse(
      req,
      res,
      200,
      "success",
      "Cập nhập tài khoản thành công",
      "/quan-ly-tai-khoan"
    );
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

async function deleteUser(req, res) {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không thấy tài khoản",
        "/quan-ly-tai-khoan"
      );
    }
    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tài khoản thành công",
      "/quan-ly-tai-khoan"
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteAllUsers(req, res) {
  try {
    await UserModel.deleteMany({});
    handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả tài khoản thành công",
      "/quan-ly-tai-khoan"
    );
  } catch (err) {
    console.log(err);
    handleResponse(
      req,
      res,
      500,
      "fail",
      "Xóa tất cả tài khoản thất bại",
      "/quan-ly-tai-khoan"
    );
  }
}

function logOut(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.clearCookie('dpixport').redirect("/dang-nhap");
  });
}