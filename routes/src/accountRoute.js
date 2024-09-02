const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/accountController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Initial setup route
router.get('/tao-tai-khoan', accountController.initialSetupPage);

router.post('/tao-tai-khoan', accountController.initialSetupCreateAccount);

router.get(
  '/',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.renderPage,
);

// Get all users
router.post(
  '/getUsers',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.getUsers,
);

// Create a new user
router.post(
  '/createUser',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.createUser,
);

// Update a user by ID
router.post(
  '/update/:id',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.updateUser,
);

// Delete a user by ID
router.post(
  '/delete/:id',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.deleteUser,
);

// Delete all users
router.post(
  '/deleteAll',
  authMiddlewares.ensureLoggedIn,authMiddlewares.ensureAdmin,
  accountController.deleteAllUsers,
);

// Log out
router.post(
  '/logOut',
  authMiddlewares.ensureLoggedIn,
  accountController.logOut,
);

module.exports = router;
