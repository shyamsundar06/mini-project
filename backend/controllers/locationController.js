const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

exports.updateLocation = async (req, res) => {
    try {
        const { tourist_id, latitude, longitude, accuracy = 5.0, speed = 0.0, heading = 0.0, battery_level = 85 } = req.body;

        if (!tourist_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Tourist ID, latitude, and longitude are required' });
        }

        const now = new Date().toISOString();

        // Update tourist record
        await query(`
            UPDATE tourists SET
                current_latitude = ?,
                current_longitude = ?,
                last_location_time = ?,
                status = CASE WHEN status = 'EMERGENCY' THEN 'EMERGENCY' ELSE 'ACTIVE' END
            WHERE id = ?
        `, [latitude, longitude, now, tourist_id]);

        // Insert historical breadcrumb
        const locId = `loc_${uuidv4().substring(0, 8)}`;
        await query(`
            INSERT INTO tourist_locations (id, tourist_id, latitude, longitude, accuracy, speed, heading, battery_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [locId, tourist_id, latitude, longitude, accuracy, speed, heading, battery_level, now]);

        // Broadcast to operator dashboards in real-time
        if (req.app.get('io')) {
            req.app.get('io').emit('location:update', {
                tourist_id,
                latitude,
                longitude,
                timestamp: now,
                battery_level
            });
        }

        res.json({ success: true, message: 'Location updated and broadcasted.' });
    } catch (err) {
        console.error('[LocationController] updateLocation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLiveLocations = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;

        const tourists = await query(`
            SELECT t.id, t.name, t.age, t.preferred_language, t.walking_preference, t.activity_preference,
                   t.current_latitude, t.current_longitude, t.last_location_time, t.status,
                   g.id as group_id, g.name as group_name, g.color_hex as group_color
            FROM tourists t
            LEFT JOIN groups g ON t.group_id = g.id
            WHERE t.tour_id = ? OR t.tour_id IS NULL
        `, [tour_id]);

        // Also fetch active emergencies to pin directly on map
        const emergencies = await query(`
            SELECT e.*, t.name as tourist_name, g.name as group_name
            FROM emergencies e
            JOIN tourists t ON e.tourist_id = t.id
            LEFT JOIN groups g ON e.group_id = g.id
            WHERE e.status IN ('ACTIVE', 'INVESTIGATING')
        `);

        res.json({
            success: true,
            tourists,
            emergencies
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
