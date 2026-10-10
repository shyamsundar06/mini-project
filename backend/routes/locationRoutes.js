const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.post('/update', locationController.updateLocation);
router.get('/live', locationController.getLiveLocations);

module.exports = router;
