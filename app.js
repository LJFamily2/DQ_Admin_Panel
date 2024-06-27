if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  
}

var express = require('express');
const expressLayouts = require("express-ejs-layouts");
var path = require('path');
const session = require('express-session');
var logger = require('morgan');
const passport = require("passport");
const flash = require("connect-flash");

var app = express();

// Include connect-livereload middleware
var livereload = require("livereload");
var connectLiveReload = require("connect-livereload");
// LiveReload Setup
if (process.env.NODE_ENV !== "production") {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, 'public'));

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 800);
  });

  app.use(connectLiveReload());
}


// Setup Session
const isProduction = process.env.NODE_ENV === "production"
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProduction},
  name: 'dpixport'
}));
const initializePassport = require("./middlewares/passportConfig");
initializePassport(passport);
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
app.use(flash());

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
