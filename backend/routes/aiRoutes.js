const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.post('/analyze', authenticateToken, aiController.runAIAnalysis);
router.get('/recommendations', aiController.getRecommendations);
router.post('/recommendations/:id/respond', authenticateToken, aiController.respondRecommendation);
router.post('/voice-query', aiController.handleVoiceQuery);

module.exports = router;
