const express = require("express");
const router = express.Router();

const authMiddlewares = require('../../middlewares/authMiddlewares');
const actionHistory = require('../../controllers/actionHistoryController');

// Apply ensureLoggedIn middleware to all routes
router.use(authMiddlewares.ensureLoggedIn);
router.use(authMiddlewares.ensureWorkingHours);

// Activity history
router.get(
  '/nhat-ky-hoat-dong',
  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),
  actionHistory.renderPage,
);
router.post('/nhat-ky-hoat-dong/deleteData/:id', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),
actionHistory.deleteData)
router.post('/nhat-ky-hoat-dong/deleteAllData', authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),
actionHistory.deleteAllData)

module.exports = router;
