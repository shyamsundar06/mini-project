const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', itineraryController.getItinerary);
router.post('/items', authenticateToken, itineraryController.addItineraryItem);
router.put('/items/:id', authenticateToken, itineraryController.updateItineraryItem);
router.post('/apply-ai-adaptation', authenticateToken, itineraryController.applyAIAdaptation);

module.exports = router;
