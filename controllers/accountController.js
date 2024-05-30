const UserModel = require("../models/userAccount");
const bcrypt = require("bcrypt");

async function renderPage(req, res) {
  try {
    const users = await UserModel.find({role: false});
    res.render("src/accountPage", { layout: "./layouts/defaultLayout", users });
  } catch {
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new UserModel({
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUsers(req, res) {
  try {
    const draw = req.body.draw;
    const start = parseInt(req.body.start, 10);
    const length = parseInt(req.body.length, 10);
    const searchValue = req.body.search.value;

    const query = {};
    const searchQuery = searchValue
      ? { username: { $regex: searchValue, $options: "i" } }
      : {};

    const totalRecords = await UserModel.countDocuments(query);
    const filteredRecords = await UserModel.countDocuments(searchQuery);
    const users = await UserModel.find({ ...searchQuery, role: false })
      .skip(start)
      .limit(length)
      .exec();

    const data = users.map((user, index) => ({
      no: start + index + 1,
      created: user.getFormattedDateTime(),
      username: user.username,
      email: user.email,
      id: user._id,
    }));

    res.json({
      draw: draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: data,
    });
  } catch (error) {
    console.error("Error handling DataTable request:", error);
    res.status(500).json({
      error: "An error occurred while processing the request.",
    });
  }
}

async function getUser(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.username = req.body.username || user.username;
    user.role = req.body.role || user.role;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await user.remove();
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function logOut(req, res) {
  req.logout();
  res.redirect("/login");
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  logOut,
  renderPage,
};
