const express = require("express");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const accountController = require('../../controllers/accountController')



router.get("/", connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.renderPage)

// Get all users
router.post('/getUsers', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.getUsers);

// Create a new user
router.post('/createUser', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.createUser);

// Update a user by ID
router.post('/update/:id', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.updateUser);

// Delete a user by ID
router.post('/delete/:id', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.deleteUser);

// Delete all users
router.post('/deleteAll', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.deleteAllUsers);

// Log out
router.post('/logOut', connectEnsureLogin.ensureLoggedIn({redirectTo:'/dang-nhap'}), accountController.logOut);

module.exports = router;