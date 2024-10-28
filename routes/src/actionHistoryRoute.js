const express = require("express");
const router = express.Router();

const authMiddlewares = require('../../middlewares/authMiddlewares');
const actionHistory = require('../../controllers/actionHistoryController');

// Activity history
router.get(
  '/nhat-ky-hoat-dong',
  authMiddlewares.ensureRoles(['Admin']),
  actionHistory.renderPage,
);
router.post('/nhat-ky-hoat-dong/deleteData/:id', authMiddlewares.ensureRoles(['Admin']),
actionHistory.deleteData)
router.post('/nhat-ky-hoat-dong/deleteAllData', authMiddlewares.ensureRoles(['Admin']),
actionHistory.deleteAllData)

module.exports = router;
