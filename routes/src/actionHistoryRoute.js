const express = require("express");
const router = express.Router();

const authMiddlewares = require('../../middlewares/authMiddlewares');
const actionHistory = require('../../controllers/actionHistoryController');

// Activity history
router.get(
  '/nhat-ky-hoat-dong',
  authMiddlewares.ensureRoles(['Admin', 'Văn phòng']),
  actionHistory.renderPage,
);

module.exports = router;
