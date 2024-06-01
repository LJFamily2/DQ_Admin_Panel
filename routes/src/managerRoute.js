const express = require("express");
const connectEnsureLogin = require('connect-ensure-login');
const router = express.Router();
const managerController = require('../../controllers/managerController');
const upload = require('../../middlewares/multer');

// Render the page
router.get("/", managerController.renderPage);

// Get managers for DataTable
router.post('/getManagers', managerController.getManagers);

// Create a new manager
router.post('/addManger', upload.fields([
  { name: 'frontIdentification', maxCount: 1 },
  { name: 'backIdentification', maxCount: 1 }
]), managerController.createManager);

// Update an existing manager
router.post('/update/:id', upload.fields([
  { name: 'frontIdentification', maxCount: 1 },
  { name: 'backIdentification', maxCount: 1 }
]), managerController.updateManager);

// Delete a manager
router.post('/delete/:id', managerController.deleteManager);

// Delete all managers
router.post('/deleteAll', managerController.deleteAllManagers);

module.exports = router;
