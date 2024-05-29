const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("src/accountPage" , {layout:"./layouts/defaultLayout"})
})

// Create a new user
router.post('/', userController.createUser);

// Update a user by ID
router.put('/:id', userController.updateUser);

// Delete a user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;