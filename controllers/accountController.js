const UserModel = require("../models/accountModel");
const bcrypt = require("bcryptjs");
const handleResponse = require("./utils/handleResponse");
const trimStringFields = require("./utils/trimStringFields");
const { DailySupply } = require("../models/dailySupplyModel");

module.exports = {
  initialSetupPage,
  initialSetupCreateAccount,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  logOut,
  renderPage,
  deleteAllUsers,
  updateUserPermissions
};

async function isDatabaseEmpty() {
  const userCount = await UserModel.countDocuments();
  return userCount === 0;
}

async function initialSetupPage(req, res) {
  try {
    if (await isDatabaseEmpty()) {
      res.render("src/signUpPage", { layout: false, messages: req.flash() });
    } else {
      res.status(404).redirect("/dang-nhap");
    }
  } catch (error) {
    res.status(404).render("partials/404", { layout: false });
  }
}

async function initialSetupCreateAccount(req, res) {
  try {
    if (await isDatabaseEmpty()) {
      await createUser(req, res);
    } else {
      res.status(404).redirect("/dang-nhap");
    }
  } catch (error) {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function renderPage(req, res) {
  try {
    const users = await UserModel.find();
    res.render("src/accountPage", {
      layout: "./layouts/defaultLayout",
      users,
      user: req.user,
      messages: req.flash(),
      title: "Quản lý tài khoản",
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function createUser(req, res) {
  req.body = trimStringFields(req.body);
  try {
    let existedUsername = await UserModel.findOne({
      username: req.body.username,
    });
    if (existedUsername) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Tên tài khoản đã tồn tại",
        req.headers.referer
      );
    }

    // Process permissions
    const pages = req.body.pages.map(page => ({
      path: page.path,
      allowed: page.allowed === 'true',
      actions: {
        view: page.view === 'true',
        add: page.add === 'true',
        update: page.update === 'true',
        delete: page.delete === 'true'
      }
    }));

    // If Admin role, set full permissions
    if (req.body.role === 'Admin') {
      pages.forEach(page => {
        page.allowed = true;
        page.actions = {
          view: true,
          add: true,
          update: true,
          delete: true
        };
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    const user = await UserModel.create({
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
      permissions: {pages}
    });

    if (!user) {
      return handleResponse(
        req,
        res,
        404,
        "fail", 
        "Tạo tài khoản thất bại",
        req.headers.referer
      );
    }

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Tạo tài khoản thành công", 
      req.headers.referer
    );

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function getUsers(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || "";
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === "asc" ? 1 : -1;

    const searchQuery = {
      $or: [
        { username: { $regex: searchValue, $options: "i" } },
        { role: { $regex: searchValue, $options: "i" } },
      ],
    };

    const totalRecords = await UserModel.countDocuments();
    const filteredRecords = await UserModel.countDocuments(searchQuery);
    const users = await UserModel.find(searchQuery)
      .sort({ role: 1, [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10));

    const data = users.map((user, index) => ({
      no: parseInt(start, 10) + index + 1,
      username: user.username,
      password: "**********",
      role: user.role,
      id: user._id,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    req.body = trimStringFields(req.body);

    // Process permissions
    const pages = req.body.pages.map(page => ({
      path: page.path,
      allowed: page.allowed === 'true',
      actions: {
        view: page.view === 'true', 
        add: page.add === 'true',
        update: page.update === 'true', 
        delete: page.delete === 'true'
      }
    }));

    // Admin gets full permissions
    if (req.body.role === 'Admin') {
      pages.forEach(page => {
        page.allowed = true;
        page.actions = {
          view: true,
          add: true, 
          update: true,
          delete: true
        };
      });
    }

    const updateFields = {
      role: req.body.role,
      permissions: { pages }
    };

    // Update password if provided
    if (req.body.newPassword) {
      updateFields.password = await bcrypt.hash(req.body.newPassword, 10);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Cập nhật tài khoản thất bại",
        req.headers.referer
      );
    }

    return handleResponse(
      req,
      res,
      200, 
      "success",
      "Cập nhật tài khoản thành công",
      req.headers.referer
    );

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không thấy tài khoản",
        req.headers.referer
      );
    }
    if (user.role === "Admin") {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không thể xóa tài khoản quản trị",
        req.headers.referer
      );
    }

    // Proceed to delete the user from the database
    await UserModel.findByIdAndDelete(req.params.id);
    // Remove the accountID from the DailySupply collection
    await DailySupply.updateMany(
      { accountID: req.params.id },
      { $unset: { accountID: "" } }
    );

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tài khoản thành công",
      req.headers.referer
    );
  } catch {
    res.status(500).render("partials/500", { layout: false });
  }
}

async function deleteAllUsers(req, res) {
  try {
    // Find all users with role not equal to 'Admin'
    const usersToDelete = await UserModel.find({ role: { $ne: "Admin" } });

    if (usersToDelete.length === 0) {
      return handleResponse(
        req,
        res,
        404,
        "fail",
        "Không có tài khoản nào để xóa",
        req.headers.referer
      );
    }

    // Extract user IDs
    const userIds = usersToDelete.map((user) => user._id);

    // Delete all users with role not equal to 'Admin'
    await UserModel.deleteMany({ _id: { $in: userIds } });

    // Remove the accountID from the DailySupply collection
    await DailySupply.updateMany(
      { accountID: { $in: userIds } },
      { $unset: { accountID: "" } }
    );

    return handleResponse(
      req,
      res,
      200,
      "success",
      "Xóa tất cả tài khoản nhân viên thành công",
      req.headers.referer
    );
  } catch (error) {
    console.error(error);
    res.status(500).render("partials/500", { layout: false });
  }
}

function logOut(req, res, next) {
  // Destroy the session
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }

    // Clear specific cookies if needed
    res.clearCookie("dpixport", {
      path: "/",
      secure: true,
    });

    // Redirect to the login page or wherever appropriate
    res.redirect("/dang-nhap");
  });
}

async function updateUserPermissions(req, res) {
  try {
    const userId = req.params.id;
    const { pages, defaultActions } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        permissions: {
          pages: pages.map(p => ({
            path: p.path,
            allowed: p.allowed,
            actions: {
              view: p.view || false,
              add: p.add || false,
              update: p.update || false,
              delete: p.delete || false
            }
          })),
          defaultActions: {
            view: defaultActions.view || false,
            add: defaultActions.add || false,
            update: defaultActions.update || false,
            delete: defaultActions.delete || false
          }
        }
      },
      { new: true }
    );

    return handleResponse(
      req, 
      res,
      200,
      'success',
      'Cập nhật quyền thành công',
      req.headers.referer
    );
  } catch (error) {
    res.status(500).render('partials/500', { layout: false });
  }
}