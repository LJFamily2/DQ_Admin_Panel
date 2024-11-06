const express = require('express');
const router = express.Router();
const queryController = require('../../controllers/queryController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

router.get(
  '/',
  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),
  queryController.renderPage,
);
// router.post('/getQuery', queryController.getQuery)
router.post(
  '/getDataTotal',
  authMiddlewares.ensureRoles(['Admin', 'Giám đốc']),
  queryController.getDataTotal,
);

module.exports = router;
