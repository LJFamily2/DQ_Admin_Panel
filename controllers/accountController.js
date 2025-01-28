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
      await createUser(req, res, true);
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

async function createUser(req, res, isNew) {
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

    // For new installation, force Admin role
    if (isNew) {
      req.body.role = "superAdmin";
    }

    // Initialize default permissions structure
    const defaultPages = [
      { path: "/tong", allowed: true },
      { path: "/quan-ly-du-lieu", allowed: true },
      { path: "/quan-ly-hang-hoa", allowed: true },
      { path: "/quan-ly-hop-dong", allowed: true },
      { path: "/quan-ly-chi-tieu", allowed: true },
      { path: "/du-lieu-hang-ngay", allowed: true },
      { path: "/nhap-du-lieu/nguyen-lieu", allowed: true },
      { path: "/du-lieu/nhat-ky-hoat-dong", allowed: true }
    ];

    const pages = isNew ? defaultPages : req.body.pages.map(page => ({
      path: page.path,
      allowed: page.allowed === 'true',
      actions: {
        view: page.view === 'true',
        add: page.add === 'true',
        update: page.update === 'true',
        delete: page.delete === 'true'
      }
    }));

    // For Admin role (either new install or explicitly set), grant full permissions
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

    const hashedPassword = await bcrypt.hash(req.body.password, 20);
    
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

    if (isNew) {
      return res.redirect("/dang-nhap");
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
      role: { $ne: "superAdmin" },
      $or: [
        { username: { $regex: searchValue, $options: "i" } },
        { role: { $regex: searchValue, $options: "i" } },
      ],
    };

    const totalRecords = await UserModel.countDocuments({ role: { $ne: "superAdmin" } });
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
    const { username, role, pages, newPassword } = trimStringFields(req.body);
    const requestingUser = req.user;

    const userToUpdate = await UserModel.findById(id);
    if (!userToUpdate) {
      return handleResponse(req, res, 404, "fail", "Không tìm thấy tài khoản", req.headers.referer);
    }

    // Check permissions
    if (userToUpdate.role === 'superAdmin' && requestingUser.role !== 'superAdmin') {
      return handleResponse(req, res, 403, "fail", "Không có quyền cập nhật", req.headers.referer);
    }

    // Build update object
    const updateFields = { ...userToUpdate.toObject() };

    // Handle username update
    if (username && username !== userToUpdate.username) {
      const exists = await UserModel.findOne({ username, _id: { $ne: id } });
      if (exists) {
        return handleResponse(req, res, 400, "fail", "Tên tài khoản đã tồn tại", req.headers.referer);
      }
      updateFields.username = username;
    }

    // Handle role & permissions
    if (pages) {
      updateFields.permissions = {
        pages: pages.map(p => ({
          path: p.path,
          allowed: p.allowed === 'true',
          actions: {
            view: p.view === 'true',
            add: p.add === 'true',
            update: p.update === 'true',
            delete: p.delete === 'true'
          }
        }))
      };
    }

    if (role && userToUpdate.role !== 'superAdmin') {
      updateFields.role = role;
    }

    if (newPassword) {
      updateFields.password = await bcrypt.hash(newPassword, 20);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, updateFields, { new: true });
    
    return handleResponse(
      req, res,
      updatedUser ? 200 : 404,
      updatedUser ? "success" : "fail",
      updatedUser ? "Cập nhật thành công" : "Cập nhật thất bại",
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
    const requestingUser = req.user; 

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

    // Only superAdmin can delete Admin accounts
    if (user.role === "Admin" && requestingUser.role !== "superAdmin") {
      return handleResponse(
        req,
        res,
        403,
        "fail",
        "Bạn không thể xóa tài khoản Admin",
        req.headers.referer
      );
    }

    // Nobody can delete superAdmin accounts
    if (user.role === "superAdmin") {
      return handleResponse(
        req,
        res,
        403,
        "fail",
        "Không thể xóa tài khoản superAdmin",
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
    const requestingUser = req.user;

    // Build query based on requesting user's role
    let query = { role: { $nin: ["superAdmin"] } }; // Never delete superAdmin
    if (requestingUser.role !== "superAdmin") {
      query.role = { $nin: ["Admin", "superAdmin"] }; // Non-superAdmin users can't delete Admin accounts
    }

    // Find users to delete based on query
    const usersToDelete = await UserModel.find(query);

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

    // Delete users based on query
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
      "Xóa tất cả tài khoản được chọn thành công",
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