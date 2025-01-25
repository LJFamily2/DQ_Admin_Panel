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
    pages: [
      {
        path: {
          type: String,
          required: true,
        },
        allowed: {
          type: Boolean,
          default: false,
        },
        actions: {
          view: { type: Boolean, default: false },
          add: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
        },
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
});

const UserModel = mongoose.model("Accounts", userSchema);

module.exports = UserModel;
