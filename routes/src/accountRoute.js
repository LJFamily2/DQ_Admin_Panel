const express = require("express");
const passport = require("passport");
const connectEnsureLogin =  require('connect-ensure-login');
const router = express.Router();
const accountController = require('../../controllers/accountController')



router.get("/", (req, res) => {
    res.render("src/accountPage" , {layout:"./layouts/defaultLayout"})
})

// Create a new user
router.post('/', accountController.createUser);

// Update a user by ID
router.put('/:id', accountController.updateUser);

// Delete a user by ID
router.delete('/:id', accountController.deleteUser);

module.exports = router;