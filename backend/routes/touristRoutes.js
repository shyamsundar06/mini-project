const express = require('express');
const router = express.Router();
const touristController = require('../controllers/touristController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', touristController.getAllTourists);
router.get('/:id', touristController.getTouristById);
router.post('/', authenticateToken, touristController.createTourist);
router.put('/:id', authenticateToken, touristController.updateTourist);
router.delete('/:id', authenticateToken, touristController.deleteTourist);

module.exports = router;
