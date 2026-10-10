const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');

router.get('/', broadcastController.getBroadcasts);
router.post('/', broadcastController.createBroadcast);
router.post('/:id/ack', broadcastController.acknowledgeBroadcast);

module.exports = router;
