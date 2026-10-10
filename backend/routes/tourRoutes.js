const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.post('/', authenticateToken, tourController.createTour);
router.put('/:id', authenticateToken, tourController.updateTour);
router.delete('/:id', authenticateToken, tourController.deleteTour);

module.exports = router;
