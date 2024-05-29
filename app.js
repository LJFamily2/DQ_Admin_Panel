if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var express = require('express');
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
var path = require('path');
var logger = require('morgan');

var app = express();

// SetUp logger
app.use(logger('dev'));

// SetUp parse
app.use(express.urlencoded({ extended: true }));

// Page Template Engine
app.set("view engine", "ejs");
app.use(expressLayouts);

// Static Files
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));


// Routes
const routes = require("./routes");
routes.forEach((routeConfig) => {
  app.use(routeConfig.path, routeConfig.route);
});

app.listen(process.env.PORT || 1000, () => {
  console.log(`Server is running on port localhost:1000`);
});

