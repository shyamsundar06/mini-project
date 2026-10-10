const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/', analyticsController.getAnalytics);
router.post('/feedback', analyticsController.submitFeedback);

module.exports = router;
