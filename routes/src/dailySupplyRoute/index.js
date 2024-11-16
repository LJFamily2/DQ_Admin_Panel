const areaDataRoute = require('./areaDataRoute');
const inputDataRoute = require('./inputDataRoute');

const authMiddlewares = require("../../../middlewares/authMiddlewares");
const express = require("express");
const router = express.Router();
// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

module.exports = {
    areaDataRoute,
    inputDataRoute,
};