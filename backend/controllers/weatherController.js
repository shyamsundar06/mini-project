const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const weatherAgent = require('../agents/WeatherAgent');

/**
 * Get real-time weather monitoring & alerts for the active tour place
 */
exports.getLiveWeather = async (req, res) => {
    try {
        const {
            tour_id = 'tour_ooty_nilgiris',
            lat,
            lng,
            place,
            simulate
        } = req.query;

        // Fetch tour details and destinations from database
        let activeTour = null;
        let destinations = [];
        let scheduledActivities = [];

        try {
            const tours = await query('SELECT * FROM tours WHERE id = ?', [tour_id]);
            if (tours && tours.length > 0) {
                activeTour = tours[0];
            }
            destinations = await query('SELECT * FROM destinations WHERE tour_id = ? ORDER BY order_index ASC', [tour_id]);
            scheduledActivities = await query(`
                SELECT ii.*, a.is_weather_sensitive 
                FROM itinerary_items ii
                LEFT JOIN activities a ON ii.activity_id = a.id
                WHERE ii.itinerary_id = 'itin_day1_main'
                ORDER BY ii.order_index ASC
            `);
        } catch (dbErr) {
            console.warn('[WeatherController] DB lookup notice:', dbErr.message);
        }

        // Determine coordinates and place name
        let targetLat = lat ? parseFloat(lat) : (destinations[0]?.latitude || 11.4190);
        let targetLng = lng ? parseFloat(lng) : (destinations[0]?.longitude || 76.7112);
        let targetPlace = place || destinations[0]?.name || activeTour?.primary_destination || 'Ooty Botanical Gardens';

        // Fetch rich Open-Meteo telemetry
        const simulationOptions = simulate ? { forceScenario: simulate } : {};
        const telemetry = await weatherAgent.getFullTelemetry(targetLat, targetLng, targetPlace, simulationOptions);

        // Correlate alerts with tour activities
        if (telemetry.alerts && telemetry.alerts.length > 0) {
            const highAlert = telemetry.alerts.find(a => a.level === 'CRITICAL' || a.level === 'WARNING');
            if (highAlert && scheduledActivities.length > 0) {
                // Annotate affected activities
                const weatherSensitive = scheduledActivities.filter(a => a.is_weather_sensitive === 1 || !a.is_alternative);
                highAlert.affectedScheduleItems = weatherSensitive.map(i => ({
                    id: i.id,
                    title: i.title,
                    startTime: i.start_time,
                    location: i.location_name
                }));
            }
        }

        res.json({
            success: true,
            tour: activeTour ? {
                id: activeTour.id,
                title: activeTour.title,
                primaryDestination: activeTour.primary_destination,
                destinations
            } : null,
            telemetry
        });
    } catch (err) {
        console.error('[WeatherController] getLiveWeather error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Fetch real-time weather across all destinations for the tour
 */
exports.getTourDestinationsWeather = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris', simulate } = req.query;

        const destinations = await query('SELECT * FROM destinations WHERE tour_id = ? ORDER BY order_index ASC', [tour_id]);

        if (!destinations || destinations.length === 0) {
            // Default Nilgiri destinations if empty
            const defaults = [
                { id: 'dest_1', name: 'Ooty Botanical Gardens', latitude: 11.4190, longitude: 76.7112 },
                { id: 'dest_2', name: 'Nilgiri Tea Estate & Museum', latitude: 11.4230, longitude: 76.7320 },
                { id: 'dest_3', name: 'Doddabetta Peak Summit', latitude: 11.4010, longitude: 76.7350 },
                { id: 'dest_4', name: 'Ooty Boathouse & Lake', latitude: 11.4050, longitude: 76.6900 }
            ];
            const results = await Promise.all(defaults.map(async (d) => {
                const tel = await weatherAgent.getFullTelemetry(d.latitude, d.longitude, d.name, simulate ? { forceScenario: simulate } : {});
                return {
                    id: d.id,
                    name: d.name,
                    latitude: d.latitude,
                    longitude: d.longitude,
                    current: tel.current,
                    highestAlert: tel.alerts[0] || null
                };
            }));
            return res.json({ success: true, destinations: results });
        }

        const destinationWeather = await Promise.all(destinations.map(async (d) => {
            try {
                const tel = await weatherAgent.getFullTelemetry(d.latitude, d.longitude, d.name, simulate ? { forceScenario: simulate } : {});
                return {
                    id: d.id,
                    name: d.name,
                    order_index: d.order_index,
                    arrivalTime: d.arrival_time,
                    departureTime: d.departure_time,
                    latitude: d.latitude,
                    longitude: d.longitude,
                    current: tel.current,
                    highestAlert: tel.alerts[0] || null
                };
            } catch (dErr) {
                return {
                    id: d.id,
                    name: d.name,
                    latitude: d.latitude,
                    longitude: d.longitude,
                    current: { temperature: 18, condition: 'Partly Cloudy', rainProbability: 20 },
                    highestAlert: null
                };
            }
        }));

        res.json({
            success: true,
            tourId: tour_id,
            destinations: destinationWeather
        });
    } catch (err) {
        console.error('[WeatherController] getTourDestinationsWeather error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Broadcast real-time weather safety alert to all tourists and guides
 */
exports.broadcastWeatherAlert = async (req, res) => {
    try {
        const {
            tour_id = 'tour_ooty_nilgiris',
            title,
            message,
            priority = 'HIGH',
            location = 'Ooty / Tour Route'
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const broadcastId = `bc_wth_${uuidv4().substring(0, 8)}`;
        const senderName = 'Weather Safety Monitoring Center';

        // Insert into broadcasts table
        try {
            await query(`
                INSERT INTO broadcasts (id, tour_id, sender_name, title, message, priority, audience, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'ALL', CURRENT_TIMESTAMP)
            `, [broadcastId, tour_id, senderName, title, message, priority]);
        } catch (bcErr) {
            console.warn('[WeatherController] Could not insert broadcast into DB:', bcErr.message);
        }

        // Insert into notifications table
        try {
            const notifId = `notif_${uuidv4().substring(0, 8)}`;
            await query(`
                INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                VALUES (?, NULL, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            `, [notifId, title, message, priority === 'CRITICAL' ? 'ALERT' : 'WARNING']);
        } catch (notifErr) {
            console.warn('[WeatherController] Could not insert notification into DB:', notifErr.message);
        }

        // Emit through Socket.IO if available
        if (req.app.get('io')) {
            const io = req.app.get('io');
            const alertPayload = {
                id: broadcastId,
                tour_id,
                title,
                message,
                priority,
                location,
                sender_name: senderName,
                created_at: new Date().toISOString()
            };
            io.emit('broadcast:new', alertPayload);
            io.emit('weather:alert', alertPayload);
        }

        res.json({
            success: true,
            message: 'Real-time weather alert successfully broadcasted to tourists and operators.',
            broadcastId
        });
    } catch (err) {
        console.error('[WeatherController] broadcastWeatherAlert error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Search places for real-time monitoring
 */
exports.searchPlaces = async (req, res) => {
    try {
        const { q = 'Ooty' } = req.query;
        const results = await weatherAgent.searchPlaces(q);
        res.json({ success: true, results });
    } catch (err) {
        console.error('[WeatherController] searchPlaces error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
