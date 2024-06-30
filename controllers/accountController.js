const UserModel = require('../models/accountModel');
const bcrypt = require('bcrypt');
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
      messages: req.flash(),
      title: 'Quản lý tài khoản',
    });
  } catch {
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  console.log(req.body);
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
        'fail',
        'Tạo tài khoản thất bại',
        req.headers.referer,
      );
    }

    console.log(user);

    handleResponse(
      req,
      res,
      201,
      'success',
      'Tạo tài khoản thành công',
      req.headers.referer,
    );
  } catch (error) {
    res.status(500);
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
  } catch (error) {
    console.error('Error handling DataTable request:', error);
    res.status(500);
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
    console.log(req.body.oldPassword);
    console.log(user.password);

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

    console.log('newpassword', req.body.newPassword);

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

    console.log(newUser);

    // If the password was changed, invalidate the session
    if (passwordChanged) {
      req.session.destroy(function(err) {
        if (err) { return next(err); }
    
        // Clear specific cookies if needed
        res.clearCookie('dpixport', { path: '/', domain: 'http://localhost:1000/', secure: true });
    
        // Redirect to the login page or wherever appropriate
        res.redirect("/dang-nhap");
      });
    } else {
      handleResponse(
        req,
        res,
        200,
        'success',
        'Cập nhập tài khoản thành công',
        req.headers.referer,
      );
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
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

    if (req.session && req.session.userId === req.params.id) {
      // Destroy the session
      req.session.destroy((err) => {
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
      'success',
      'Xóa tất cả tài khoản thành công',
      req.headers.referer,
    );
  } catch (err) {
    console.log(err);
    handleResponse(
      req,
      res,
      500,
      'fail',
      'Xóa tất cả tài khoản thất bại',
      req.headers.referer,
    );
  }
}

function logOut(req, res, next) {
  // Destroy the session
  req.session.destroy(function(err) {
    if (err) { return next(err); }

    // Clear specific cookies if needed
    res.clearCookie('dpixport', { path: '/', domain: 'http://localhost:1000/', secure: true });

    // Redirect to the login page or wherever appropriate
    res.redirect("/dang-nhap");
  });
}
