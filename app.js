if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const app = express();

// Reduce the size of data being transferred over the network
app.use(compression());

// Rate limiting
// Trust the first proxy
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 500 requests per windowMs
});
app.use(limiter);

// Reduce the size of data being transferred over the network
app.use(compression());

// LiveReload Setup
if (process.env.NODE_ENV !== "production") {
  var livereload = require("livereload");
  var connectLiveReload = require("connect-livereload");
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "public"));
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 800);
  });

  app.use(connectLiveReload());
}

// Override with the X-HTTP-Method-Override header in the request
app.use(methodOverride("_method"));

// Setup Session
const SessionMongoDB = require("./sessionMongoDB");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: "auto",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    },
    name: "dpixport",
    store: SessionMongoDB,
    rolling: true,
  })
);
const initializePassport = require("./middlewares/passportConfig");
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// SetUp parse
app.use(express.urlencoded({ extended: true }));

// Page Template Engine
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(flash());

// Static Files
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));

// Setup Database
const mongoose = require("mongoose");
let mongoDB = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : process.env.MONGODB_URI_TEST;
mongoose
  .connect(mongoDB, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.log("Error connecting to MongoDB:", error.message));

// Middleware to check page access
const checkPageAccess = require('./middlewares/checkPageAccess');
app.use(checkPageAccess());

// Routes
const routes = require("./routes");
routes.forEach((routeConfig) => {
  app.use(routeConfig.path, routeConfig.route);
});

// Default path when route doesn't exist
app.use((req, res) => {
  res.render("partials/404", { layout: false });
  res.status(404).render("partials/404", { layout: false });
});

// Update automatically - Node cron
const {
  updateDateRangeAutomatically,
} = require("./controllers/dateRangeAccessController");
const {
  deleteOldActionHistory,
} = require("./controllers/actionHistoryController");

// Call the function once at startup to set the initial date range
updateDateRangeAutomatically();
// Call the function once at startup to clean up old records immediately
deleteOldActionHistory();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
