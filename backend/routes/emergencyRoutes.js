const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

router.get('/', emergencyController.getAllEmergencies);
router.post('/sos', emergencyController.triggerSOS);
router.put('/:id', emergencyController.updateEmergencyStatus);

module.exports = router;
