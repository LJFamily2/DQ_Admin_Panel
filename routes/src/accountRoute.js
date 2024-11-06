const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/accountController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Initial setup route
router.get('/tao-tai-khoan', accountController.initialSetupPage);

router.post('/tao-tai-khoan', accountController.initialSetupCreateAccount);

router.get(
  '/',authMiddlewares.ensureAdmin,
  accountController.renderPage,
);

// Get all users
router.post(
  '/getUsers',authMiddlewares.ensureAdmin,
  accountController.getUsers,
);

// Create a new user
router.post(
  '/createUser',authMiddlewares.ensureAdmin,
  accountController.createUser,
);

// Update a user by ID
router.post(
  '/update/:id',
  accountController.updateUser,
);

// Delete a user by ID
router.post(
  '/delete/:id',authMiddlewares.ensureAdmin,
  accountController.deleteUser,
);

// Delete all users
router.post(
  '/deleteAll',authMiddlewares.ensureAdmin,
  accountController.deleteAllUsers,
);

// Log out
router.post(
  '/logOut',
  accountController.logOut,
);

module.exports = router;
