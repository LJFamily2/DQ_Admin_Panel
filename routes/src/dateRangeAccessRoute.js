const express = require("express");
const router = express.Router();
const dateRangeController = require("../../controllers/dateRangeAccessController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.post(
  "/setDateRange",
  authMiddlewares.ensureRoles(["Admin"]),
  checkPermission("update"),
  dateRangeController.setDateRange
);

module.exports = router;
