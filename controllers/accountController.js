const UserModel = require('../models/accountModel');
const bcrypt = require('bcryptjs');
const handleResponse = require('./utils/handleResponse');
const trimStringFields = require('./utils/trimStringFields');

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
    const users = await UserModel.find();
    res.render('src/accountPage', {
      layout: './layouts/defaultLayout',
      users,
      user: req.user,
      messages: req.flash(),
      title: 'Quản lý tài khoản',
    });
  } catch {
    res.status(500).render('partials/500');
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
        'fail',
        'Tên tài khoản đã tồn tại. Hãy tạo với tên khác!',
        req.headers.referer,
      );
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await UserModel.create({
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
    });
    if (!user) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Tạo tài khoản thất bại',
        req.headers.referer,
      );
    }

    handleResponse(
      req,
      res,
      201,
      'success',
      'Tạo tài khoản thành công',
      req.headers.referer,
    );
  } catch {
    res.status(500).render('partials/500');
  }
}

async function getUsers(req, res) {
  try {
    const { draw, start = 0, length = 10, search, order, columns } = req.body;
    const searchValue = search?.value || '';
    const sortColumn = columns?.[order?.[0]?.column]?.data;
    const sortDirection = order?.[0]?.dir === 'asc' ? 1 : -1;

    const searchQuery = {
      username: { $regex: searchValue, $options: 'i' },
    };

    const totalRecords = await UserModel.countDocuments();
    const filteredRecords = await UserModel.countDocuments(searchQuery);
    const users = await UserModel.find(searchQuery)
      .sort({ [sortColumn]: sortDirection })
      .skip(parseInt(start, 10))
      .limit(parseInt(length, 10));

    const data = users.map((user, index) => ({
      no: parseInt(start, 10) + index + 1,
      username: user.username,
      password: '**********',
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
    res.status(500).render('partials/500');
  }
}

async function updateUser(req, res) {
  console.log(req.body);
  req.body = trimStringFields(req.body);
  const userID = req.params.id;

  if (!userID) {
    return handleResponse(
      req,
      res,
      404,
      'fail',
      'Không thấy tài khoản',
      req.headers.referer,
    );
  }

  try {
    const user = await UserModel.findById(userID);

    if (
      req.body.oldPassword &&
      !(await bcrypt.compare(req.body.oldPassword, user.password))
    ) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Mật khẩu cũ không đúng',
        req.headers.referer,
      );
    }

    const updateFields = {
      username: req.body.username,
      role: req.body.role,
    };

    let passwordChanged = false;
    if (req.body.newPassword) {
      updateFields.password = await bcrypt.hash(req.body.newPassword, 10);
      passwordChanged = true;
    }

    const newUser = await UserModel.findByIdAndUpdate(userID, updateFields, {
      new: true,
    });

    if (!newUser) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Cập nhập tài khoản thất bại',
        req.headers.referer,
      );
    }

    // If the password was changed, regenerate the session without logging the user out
    if (passwordChanged) {
      req.session.regenerate(function (err) {
        if (err) {
          return res.status(500).render('partials/500'); 
        }

        // Save the session after modifications
        req.session.save(function (saveErr) {
          if (saveErr) {
            return res.status(500).render('partials/500'); 
          }
        });
      });
    }
    handleResponse(
      req,
      res,
      200,
      'success',
      'Cập nhập tài khoản thành công',
      req.headers.referer,
    );
  } catch (error) {
    res.status(500).render('partials/500');
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
        'fail',
        'Không thấy tài khoản',
        req.headers.referer,
      );
    }
    if (user.role) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không thể xóa tài khoản quản trị',
        req.headers.referer,
      );
    }

    if (req.session && req.session.userId === req.params.id) {
      // Destroy the session
      req.session.destroy(err => {
        if (err) {
          // Handle error (optional)
          console.log('Session destruction error:', err);
        }
      });
    }

    // Proceed to delete the user from the database
    await UserModel.findByIdAndDelete(req.params.id);

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tài khoản thành công',
      req.headers.referer,
    );
  } catch {
    res.status(500).render('partials/500');
  }
}

async function deleteAllUsers(req, res) {
  try {
    // Delete all users with role false
    const deletionResult = await UserModel.deleteMany({ role: false });

    // Check if the current user is affected and destroy the session if so
    if (req.session.userRole === false) {
      req.session.destroy(err => {
        if (err) {
          console.log('Session destruction error:', err);
        }
      });
    }

    if (deletionResult.deletedCount === 0) {
      return handleResponse(
        req,
        res,
        404,
        'fail',
        'Không có tài khoản nào để xóa',
        req.headers.referer,
      );
    }

    handleResponse(
      req,
      res,
      200,
      'success',
      'Xóa tất cả tài khoản nhân viên thành công',
      req.headers.referer,
    );
  } catch {
    res.status(500).render('partials/500');
  }
}

function logOut(req, res, next) {
  // Destroy the session
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }

    // Clear specific cookies if needed
    res.clearCookie('dpixport', {
      path: '/',
      domain: 'http://localhost:1000/',
      secure: true,
    });

    // Redirect to the login page or wherever appropriate
    res.redirect('/dang-nhap');
  });
}
