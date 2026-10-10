const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

exports.getItinerary = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris', day = 1 } = req.query;

        const itineraries = await query('SELECT * FROM itineraries WHERE tour_id = ? AND day_number = ?', [tour_id, day]);
        if (!itineraries || itineraries.length === 0) {
            return res.status(404).json({ success: false, message: 'Itinerary not found for specified day' });
        }

        const itin = itineraries[0];
        const items = await query(`
            SELECT ii.*, a.activity_type, a.is_weather_sensitive, a.cost
            FROM itinerary_items ii
            LEFT JOIN activities a ON ii.activity_id = a.id
            WHERE ii.itinerary_id = ?
            ORDER BY ii.order_index ASC, ii.start_time ASC
        `, [itin.id]);

        res.json({
            success: true,
            itinerary: {
                ...itin,
                items
            }
        });
    } catch (err) {
        console.error('[ItineraryController] getItinerary error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addItineraryItem = async (req, res) => {
    try {
        const { itinerary_id, activity_id, start_time, end_time, title, description, location_name, latitude, longitude } = req.body;
        if (!itinerary_id || !start_time || !end_time || !title) {
            return res.status(400).json({ success: false, message: 'Itinerary ID, start time, end time, and title are required' });
        }

        const count = await query('SELECT COUNT(*) as count FROM itinerary_items WHERE itinerary_id = ?', [itinerary_id]);
        const nextOrder = (count[0]?.count || 0) + 1;
        const itemId = `ii_${uuidv4().substring(0, 8)}`;

        await query(
            `INSERT INTO itinerary_items (id, itinerary_id, activity_id, start_time, end_time, title, description, location_name, latitude, longitude, is_alternative, order_index, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'SCHEDULED')`,
            [itemId, itinerary_id, activity_id || null, start_time, end_time, title, description || '', location_name || '', latitude || 11.4190, longitude || 76.7112, nextOrder]
        );

        if (req.app.get('io')) {
            req.app.get('io').emit('itinerary:update', { itinerary_id });
        }

        res.status(201).json({ success: true, message: 'Item added to timeline', itemId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateItineraryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time, title, description, location_name, status, weather_alert, is_alternative } = req.body;

        await query(`
            UPDATE itinerary_items SET
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                location_name = COALESCE(?, location_name),
                status = COALESCE(?, status),
                weather_alert = ?,
                is_alternative = COALESCE(?, is_alternative)
            WHERE id = ?
        `, [start_time, end_time, title, description, location_name, status, weather_alert, is_alternative ? 1 : 0, id]);

        if (req.app.get('io')) {
            req.app.get('io').emit('itinerary:update', { id });
        }

        res.json({ success: true, message: 'Timeline item updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Apply AI Weather Reroute to Itinerary
 */
exports.applyAIAdaptation = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.body;

        // Locate outdoor item (Doddabetta summit) and replace with indoor tea museum multimedia & chocolate masterclass
        await query(`
            UPDATE itinerary_items SET
                title = 'Tea Museum Multimedia Cinema & Chocolate Masterclass (Indoor)',
                description = 'Indoor interactive tea tasting, documentary screening, and homemade artisanal chocolate masterclass.',
                location_name = 'Tea Museum & Chocolate Studio',
                latitude = 11.4235,
                longitude = 76.7325,
                is_alternative = 1,
                status = 'REPLACED',
                weather_alert = 'Adapted by AI Coordinator due to afternoon thunderstorm at mountain summit.'
            WHERE itinerary_id = 'itin_day1_main' AND (title LIKE '%Doddabetta%' OR title LIKE '%Peak%')
        `);

        await query(`
            UPDATE ai_recommendations SET status = 'APPROVED' WHERE tour_id = ? AND status = 'PENDING'
        `, [tour_id]);

        // Broadcast real-time event to all tourists and operators
        if (req.app.get('io')) {
            req.app.get('io').emit('itinerary:update', {
                tour_id,
                message: 'Itinerary updated with AI Weather-Proof alternative.'
            });
            req.app.get('io').emit('ai:recommendation', {
                status: 'APPROVED',
                message: 'AI Adaptation applied successfully.'
            });
        }

        res.json({
            success: true,
            message: 'AI adaptation applied. Tourist itineraries synchronized in real-time.'
        });
    } catch (err) {
        console.error('[ItineraryController] applyAIAdaptation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
