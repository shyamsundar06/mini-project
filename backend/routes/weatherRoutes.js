const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Real-time weather monitoring & alerts for tour place
router.get('/current', weatherController.getLiveWeather);

// Real-time weather across all tour destinations
router.get('/tour-destinations', weatherController.getTourDestinationsWeather);

// Broadcast weather safety alert to all tourists
router.post('/broadcast-alert', weatherController.broadcastWeatherAlert);

// Search places using Open-Meteo geocoding
router.get('/search-places', weatherController.searchPlaces);

module.exports = router;
