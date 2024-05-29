const UserModel = require('../models/User');
const bcrypt = require('bcrypt');

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
    const users = await UserModel.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUser(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      return res.status(404).json({ error: 'User not found' });
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
      return res.status(404).json({ error: 'User not found' });
    }
    await user.remove();
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function logOut(req,res){
  req.logout();
  res.redirect('/login');
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  logOut
};
