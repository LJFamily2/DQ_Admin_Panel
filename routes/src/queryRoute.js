const express = require("express");
const router = express.Router();
const queryController = require("../../controllers/queryController");
const authMiddlewares = require("../../middlewares/authMiddlewares");

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

router.get(
  "/",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  queryController.renderPage
);
// router.post('/getQuery', queryController.getQuery)
router.post(
  "/getDataTotal",
  authMiddlewares.ensureRoles(["Admin", "Quản lý"]),
  queryController.getDataTotal
);

module.exports = router;
