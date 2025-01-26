const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/accountController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");
const setUnreadCount = require("../../middlewares/unreadCountMiddleware");
const checkPageAccess = require("../../middlewares/checkPageAccess");


const commonMiddlewares = [
  authMiddlewares.ensureLoggedIn,
  authMiddlewares.ensureWorkingHours,
  authMiddlewares.ensureAdmin,
  checkPageAccess
];

// Initial setup route
router.get("/tao-tai-khoan", accountController.initialSetupPage);
router.post("/tao-tai-khoan", accountController.initialSetupCreateAccount);

// Main page
router.get("/", ...commonMiddlewares, setUnreadCount, accountController.renderPage);

// Get all users
router.post("/getUsers", ...commonMiddlewares, accountController.getUsers);

// Create a new user
router.post(
  "/",
  ...commonMiddlewares,
  checkPermission("add"),
  accountController.createUser
);

// Update a user by ID
router.put("/:id", checkPermission("update"), accountController.updateUser);

// Delete a user by ID
router.delete(
  "/:id",
  ...commonMiddlewares,
  checkPermission("delete"),
  accountController.deleteUser
);

// Delete all users
router.delete(
  "/deleteAll",
  ...commonMiddlewares,
  checkPermission("delete"),
  accountController.deleteAllUsers
);

// Log out
router.post(
  "/logOut",
  authMiddlewares.ensureLoggedIn,
  authMiddlewares.ensureWorkingHours,
  accountController.logOut
);

module.exports = router;
