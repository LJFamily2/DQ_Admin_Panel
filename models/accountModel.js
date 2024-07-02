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
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
});

userSchema.methods.getFormattedDateTime = function () {
    const dateOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

    if (this.createdAt) {
      const formattedDate = this.createdAt.toLocaleDateString(
        "en-GB",
        dateOptions
      );
      
      return `${formattedDate}`;
    } else {
      return "";
    }
  };

const UserModel = mongoose.model("Accounts", userSchema);


module.exports = UserModel;
