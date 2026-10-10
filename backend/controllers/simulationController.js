const { query } = require('../config/db');
const emergencyController = require('./emergencyController');
const coordinatorAgent = require('../agents/CoordinatorAgent');

// Predefined walking waypoints in Ooty Botanical Gardens & surrounding spots
const WAYPOINTS = [
    { lat: 11.4190, lng: 76.7112 }, // Garden Main Gate
    { lat: 11.4196, lng: 76.7118 }, // Italian Terraced Garden
    { lat: 11.4205, lng: 76.7125 }, // Conservatory & Fern House
    { lat: 11.4215, lng: 76.7132 }, // Toda Hill & Fossil Tree
    { lat: 11.4225, lng: 76.7200 }, // Tea Plantation approach
    { lat: 11.4230, lng: 76.7320 }  // Tea Factory Complex
];

let simStepIndex = 0;

exports.simulateGPSStep = async (req, res) => {
    try {
        simStepIndex = (simStepIndex + 1) % WAYPOINTS.length;
        const basePoint = WAYPOINTS[simStepIndex];

        // Shift all active tourists with small jitter around group waypoint
        const tourists = await query('SELECT id, group_id FROM tourists');

        for (const t of tourists) {
            const jitterLat = (Math.random() - 0.5) * 0.0012;
            const jitterLng = (Math.random() - 0.5) * 0.0012;
            const newLat = Number((basePoint.lat + jitterLat).toFixed(6));
            const newLng = Number((basePoint.lng + jitterLng).toFixed(6));

            await query(`
                UPDATE tourists SET
                    current_latitude = ?,
                    current_longitude = ?,
                    last_location_time = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newLat, newLng, t.id]);
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('location:update', {
                simulated: true,
                waypointIndex: simStepIndex,
                center: basePoint
            });
        }

        res.json({
            success: true,
            message: `Simulated GPS step ${simStepIndex + 1}/${WAYPOINTS.length}`,
            currentWaypoint: basePoint
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.simulateWeatherDisruption = async (req, res) => {
    try {
        const io = req.app.get('io');
        const tourists = await query('SELECT * FROM tourists');
        const items = await query("SELECT * FROM itinerary_items WHERE itinerary_id = 'itin_day1_main'");

        // Force rain simulation through Coordinator Agent
        const analysis = await coordinatorAgent.synthesize({
            latitude: 11.4010,
            longitude: 76.7350,
            itineraryItems: items,
            tourists,
            simulationOptions: { forceRain: true }
        });

        // Insert AI recommendation
        await query(`
            INSERT INTO ai_recommendations (id, tour_id, agent_source, recommendation_text, reason, confidence_score, affected_groups, affected_activities, suggested_alternative, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [
            `rec_sim_${Date.now()}`,
            'tour_ooty_nilgiris',
            'Coordinator Agent (Multi-Agent System)',
            analysis.recommendation.recommendation,
            analysis.recommendation.reason,
            0.96,
            'Alpha - Nature Trekkers, Beta - Heritage & Culture',
            'Doddabetta Summit & Shola Ridge Walk',
            'Tea Museum Multimedia Cinema & Artisan Chocolate Tasting (Indoor)'
        ]);

        if (io) {
            io.emit('ai:recommendation', {
                recommendation: analysis.recommendation,
                disruptive: true
            });
        }

        res.json({
            success: true,
            message: 'Weather disruption simulated. Multi-agent AI recommendation generated.',
            analysis
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.simulateEmergencySOS = async (req, res) => {
    try {
        req.body = {
            tourist_id: 'trt_1',
            tour_id: 'tour_ooty_nilgiris',
            latitude: 11.4195,
            longitude: 76.7119,
            emergency_type: 'ACUTE_ASTHMA_SPASM',
            message: 'Simulated SOS: Tourist experiencing acute mountain breathing difficulty near upper terraced garden.'
        };
        return emergencyController.triggerSOS(req, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.resetDemoData = async (req, res) => {
    try {
        // Reset emergency statuses
        await query("UPDATE emergencies SET status = 'RESOLVED' WHERE id != 'emg_sample_1'");
        await query("UPDATE tourists SET status = 'ACTIVE'");
        await query("UPDATE ai_recommendations SET status = 'PENDING' WHERE id = 'rec_init_1'");
        await query("DELETE FROM ai_recommendations WHERE id LIKE 'rec_sim_%'");

        // Reset itinerary items back to original outdoor
        await query(`
            UPDATE itinerary_items SET
                title = 'Doddabetta Peak & Telescope Observation',
                description = 'Sweeping vistas of the Western Ghats and pine ridge trail.',
                location_name = 'Doddabetta Summit',
                latitude = 11.4010,
                longitude = 76.7350,
                is_alternative = 0,
                status = 'SCHEDULED',
                weather_alert = 'Rain alert: Rain probability 75% between 14:00 - 17:00'
            WHERE itinerary_id = 'itin_day1_main' AND order_index = 5
        `);

        if (req.app.get('io')) {
            req.app.get('io').emit('tour:update', { message: 'Demo data reset to initial state' });
        }

        res.json({ success: true, message: 'Demo environment reset to baseline.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
