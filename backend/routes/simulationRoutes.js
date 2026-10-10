const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/gps-step', simulationController.simulateGPSStep);
router.post('/weather-disruption', simulationController.simulateWeatherDisruption);
router.post('/emergency-sos', simulationController.simulateEmergencySOS);
router.post('/reset', simulationController.resetDemoData);

module.exports = router;
