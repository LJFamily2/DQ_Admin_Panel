const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const accountController = require('../../controllers/accountController')



router.get("/", accountController.renderPage)

// Get all users
router.post('/getUsers', accountController.getUsers);

// Create a new user
router.post('/createUser', accountController.createUser);

// Update a user by ID
router.post('/update/:id', accountController.updateUser);

// Delete a user by ID
router.post('/delete/:id', accountController.deleteUser);

// Delete all users
router.post('/deleteAll', accountController.deleteAllUsers);

// Log out
router.post('/logOut', accountController.logOut);

module.exports = router;