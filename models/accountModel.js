const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String, 
    required: true, 
  }, 
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  permissions: {
    add: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
});


const UserModel = mongoose.model("Accounts", userSchema);


module.exports = UserModel;
