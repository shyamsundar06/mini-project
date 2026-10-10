const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

exports.getAllTours = async (req, res) => {
    try {
        const tours = await query('SELECT * FROM tours ORDER BY created_at DESC');

        // Fetch metrics for each tour
        const enrichedTours = await Promise.all(tours.map(async (tour) => {
            const dests = await query('SELECT COUNT(*) as count FROM destinations WHERE tour_id = ?', [tour.id]);
            const tourists = await query('SELECT COUNT(*) as count FROM tourists WHERE tour_id = ?', [tour.id]);
            const groups = await query('SELECT COUNT(*) as count FROM groups WHERE tour_id = ?', [tour.id]);
            const activities = await query('SELECT COUNT(*) as count FROM activities WHERE tour_id = ?', [tour.id]);

            return {
                ...tour,
                destinationsCount: dests[0]?.count || 0,
                touristsCount: tourists[0]?.count || 0,
                groupsCount: groups[0]?.count || 0,
                activitiesCount: activities[0]?.count || 0
            };
        }));

        res.json({ success: true, tours: enrichedTours });
    } catch (err) {
        console.error('[TourController] getAllTours error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTourById = async (req, res) => {
    try {
        const { id } = req.params;
        const tours = await query('SELECT * FROM tours WHERE id = ?', [id]);
        if (!tours || tours.length === 0) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }

        const tour = tours[0];
        const destinations = await query('SELECT * FROM destinations WHERE tour_id = ? ORDER BY order_index ASC', [id]);
        const activities = await query('SELECT * FROM activities WHERE tour_id = ? ORDER BY created_at ASC', [id]);
        const groups = await query('SELECT * FROM groups WHERE tour_id = ?', [id]);
        const tourists = await query('SELECT * FROM tourists WHERE tour_id = ?', [id]);
        const itineraries = await query('SELECT * FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC', [id]);
        const expenses = await query('SELECT * FROM tour_expenses WHERE tour_id = ? ORDER BY date DESC', [id]);
        const costs = await query('SELECT * FROM tour_costs WHERE tour_id = ? ORDER BY created_at DESC LIMIT 1', [id]);

        res.json({
            success: true,
            tour: {
                ...tour,
                destinations,
                activities,
                groups,
                tourists,
                itineraries,
                expenses,
                costEstimate: costs[0] || null
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createTour = async (req, res) => {
    try {
        const {
            title,
            description,
            start_date,
            end_date,
            budget = 150000,
            max_capacity = 25,
            primary_destination,
            destinations = [],
            activities = []
        } = req.body;

        if (!title || !start_date || !end_date || !primary_destination) {
            return res.status(400).json({ success: false, message: 'Title, start/end date, and primary destination are required' });
        }

        const tourId = `tour_${uuidv4().substring(0, 8)}`;
        const operatorId = 'op_1'; // Current or fallback operator

        await query(
            'INSERT INTO tours (id, operator_id, title, description, start_date, end_date, budget, max_capacity, status, primary_destination) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tourId, operatorId, title, description || '', start_date, end_date, budget, max_capacity, 'ACTIVE', primary_destination]
        );

        // Insert destinations
        for (let i = 0; i < destinations.length; i++) {
            const d = destinations[i];
            const destId = `dest_${uuidv4().substring(0, 8)}`;
            await query(
                'INSERT INTO destinations (id, tour_id, name, description, latitude, longitude, order_index, arrival_time, departure_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [destId, tourId, d.name, d.description || '', d.latitude || 11.4190, d.longitude || 76.7112, i + 1, d.arrival_time || '09:00 AM', d.departure_time || '12:00 PM']
            );
        }

        // Insert activities
        for (const act of activities) {
            const actId = `act_${uuidv4().substring(0, 8)}`;
            await query(
                'INSERT INTO activities (id, tour_id, destination_id, title, description, activity_type, duration_minutes, cost, is_weather_sensitive, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [actId, tourId, act.destination_id || null, act.title, act.description || '', act.activity_type || 'sightseeing', act.duration_minutes || 60, act.cost || 0, act.is_weather_sensitive ? 1 : 0, act.latitude || 11.4190, act.longitude || 76.7112, 'SCHEDULED']
            );
        }

        // Create default itinerary
        const itinId = `itin_${uuidv4().substring(0, 8)}`;
        await query(
            'INSERT INTO itineraries (id, tour_id, day_number, date, title, status) VALUES (?, ?, ?, ?, ?, ?)',
            [itinId, tourId, 1, start_date, `Day 1: ${title}`, 'ACTIVE']
        );

        res.status(201).json({
            success: true,
            message: 'Tour created successfully',
            tourId
        });
    } catch (err) {
        console.error('[TourController] createTour error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_date, end_date, budget, max_capacity, status, primary_destination } = req.body;

        await query(
            'UPDATE tours SET title = COALESCE(?, title), description = COALESCE(?, description), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), budget = COALESCE(?, budget), max_capacity = COALESCE(?, max_capacity), status = COALESCE(?, status), primary_destination = COALESCE(?, primary_destination) WHERE id = ?',
            [title, description, start_date, end_date, budget, max_capacity, status, primary_destination, id]
        );

        res.json({ success: true, message: 'Tour updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM tours WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tour deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
