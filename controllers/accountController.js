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
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
     await UserModel.create({
      username,
      password: hashedPassword,
      role: false,
    });
    res.status(201).redirect('/quan-ly-tai-khoan');
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      username: user.username,
      password: 'null',
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
    res.status(200).redirect('/quan-ly-tai-khoan');
  } catch (err) {
    console.log(err)
    res.status(500);
  }
}

async function deleteUser(req, res) {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).redirect('/quan-ly-tai-khoan');
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
  updateUser,
  deleteUser,
  logOut,
  renderPage,
};
