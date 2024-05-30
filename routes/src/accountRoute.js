const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const accountController = require('../../controllers/accountController')



router.get("/", accountController.renderPage)

// Get all users
router.post('/getUsers', accountController.getUsers);

// Create a new user

router.post('/', accountController.createUser);

// Update a user by ID
router.put('/:id', accountController.updateUser);

// Delete a user by ID
router.delete('/:id', accountController.deleteUser);

module.exports = router;