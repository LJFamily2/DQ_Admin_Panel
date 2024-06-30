const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const UserModel = require("../models/accountModel");

async function initialize(passport) {
  const authenticater = async (username, password, done) => {
    try {
      const user = await UserModel.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Invalid username or password" });
      }
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "username" }, authenticater));

  // serialize and deserialize are used to store the user in the session
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}

module.exports = initialize;
