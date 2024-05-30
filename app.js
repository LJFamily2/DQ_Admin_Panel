if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var express = require('express');
const expressLayouts = require("express-ejs-layouts");
var path = require('path');
const session = require('express-session');
var logger = require('morgan');
const passport = require("passport");

var app = express();

// Setup Session
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } 
}));
app.use(passport.initialize());
app.use(passport.session());

// SetUp logger
app.use(logger('dev'));

// SetUp parse
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Page Template Engine
app.set("view engine", "ejs");
app.use(expressLayouts);

// Static Files
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));

// Setup Database
const mongoose = require('mongoose');
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.log("Error connecting to MongoDB:", error.message));

// Routes
const routes = require("./routes");
routes.forEach((routeConfig) => {
  app.use(routeConfig.path, routeConfig.route);
});

app.listen(process.env.PORT || 1000, () => {
  console.log(`Server is running on port localhost:1000`);
});

