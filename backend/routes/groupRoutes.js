const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', groupController.getAllGroups);
router.get('/strategies', groupController.getStrategies);
router.post('/generate-ai', authenticateToken, groupController.generateAIGroups);
router.post('/approve-ai', authenticateToken, groupController.approveAIGroups);
router.post('/move-tourist', authenticateToken, groupController.moveTourist);

module.exports = router;
