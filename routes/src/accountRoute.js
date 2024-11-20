const express = require("express");
const router = express.Router();
const accountController = require('../../controllers/accountController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

const commonMiddlewares = [
  authMiddlewares.ensureLoggedIn,
  authMiddlewares.ensureWorkingHours,
  authMiddlewares.ensureAdmin,
];

// Initial setup route
router.get('/tao-tai-khoan', accountController.initialSetupPage);
router.post('/tao-tai-khoan', accountController.initialSetupCreateAccount);

// Main page
router.get('/', ...commonMiddlewares, accountController.renderPage);

// Get all users
router.post("/getUsers", ...commonMiddlewares, accountController.getUsers);

// Create a new user
router.post("/createUser", ...commonMiddlewares, accountController.createUser);

// Update a user by ID
router.post("/update/:id", accountController.updateUser);

// Delete a user by ID
router.post("/delete/:id", ...commonMiddlewares, accountController.deleteUser);

// Delete all users
router.post(
  "/deleteAll",
  ...commonMiddlewares,
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
