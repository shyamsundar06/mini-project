const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const emergencyAgent = require('../agents/EmergencyAgent');

exports.getAllEmergencies = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;
        const emergencies = await query(`
            SELECT e.*, 
                   t.name as tourist_name, t.emergency_contact_phone as tourist_phone, t.emergency_contact_name, t.emergency_contact_phone,
                   g.name as group_name, g.color_hex as group_color,
                   ee.transport_type, ee.estimated_distance_km, ee.estimated_cost_min, ee.estimated_cost_max, ee.reserve_available
            FROM emergencies e
            JOIN tourists t ON e.tourist_id = t.id
            LEFT JOIN groups g ON e.group_id = g.id
            LEFT JOIN emergency_expenses ee ON e.id = ee.emergency_id
            WHERE e.tour_id = ? OR e.tour_id IS NULL
            ORDER BY CASE WHEN e.status = 'ACTIVE' THEN 1 WHEN e.status = 'INVESTIGATING' THEN 2 ELSE 3 END, e.reported_at DESC
        `, [tour_id]);

        res.json({ success: true, emergencies });
    } catch (err) {
        console.error('[EmergencyController] getAllEmergencies error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.triggerSOS = async (req, res) => {
    try {
        const {
            tourist_id = 'trt_1',
            tour_id = 'tour_ooty_nilgiris',
            latitude = 11.4192,
            longitude = 76.7115,
            emergency_type = 'MEDICAL',
            message = 'Urgent assistance requested by tourist.'
        } = req.body;

        // Fetch tourist and group info
        const tourists = await query(`
            SELECT t.*, g.name as group_name 
            FROM tourists t 
            LEFT JOIN groups g ON t.group_id = g.id 
            WHERE t.id = ?
        `, [tourist_id]);

        const tourist = tourists[0] || { name: 'Rahul Kumar', group_name: 'Group Alpha' };
        const emergencyId = `emg_${uuidv4().substring(0, 8)}`;
        const now = new Date().toISOString();

        // 1. Triage with Emergency Agent
        const triageResult = await emergencyAgent.triage({
            tourist_id,
            tourist_name: tourist.name,
            group_name: tourist.group_name,
            latitude,
            longitude,
            emergency_type
        });

        // 2. Insert Emergency Record
        await query(`
            INSERT INTO emergencies (id, tourist_id, tour_id, group_id, latitude, longitude, emergency_type, message, status, priority, assigned_responder, reported_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'CRITICAL', ?, ?)
        `, [
            emergencyId, tourist_id, tour_id, tourist.group_id || null, latitude, longitude, emergency_type, message,
            triageResult.nearestSupport?.name || 'Ooty Rapid Rescue Team', now
        ]);

        // 3. Insert Emergency Expense Estimation
        const eeId = `ee_${uuidv4().substring(0, 8)}`;
        const exp = triageResult.operationalExpense;
        await query(`
            INSERT INTO emergency_expenses (id, emergency_id, transport_type, estimated_distance_km, estimated_cost_min, estimated_cost_max, reserve_available, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            eeId, emergencyId, exp.transportType, exp.distanceKm,
            exp.estimatedCostRange.min, exp.estimatedCostRange.max, exp.availableReserve, exp.disclaimer
        ]);

        // Update tourist status
        await query("UPDATE tourists SET status = 'EMERGENCY' WHERE id = ?", [tourist_id]);

        const alertPayload = {
            id: emergencyId,
            tourist_id,
            tourist_name: tourist.name,
            group_name: tourist.group_name,
            latitude,
            longitude,
            emergency_type,
            message,
            status: 'ACTIVE',
            priority: 'CRITICAL',
            reported_at: now,
            triage: triageResult
        };

        // Broadcast high-priority socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('emergency:new', alertPayload);
        }

        res.status(201).json({
            success: true,
            message: '🚨 Emergency SOS broadcasted immediately.',
            emergency: alertPayload
        });
    } catch (err) {
        console.error('[EmergencyController] triggerSOS error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateEmergencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigned_responder, resolution_notes, actual_cost } = req.body;
        const now = new Date().toISOString();

        await query(`
            UPDATE emergencies SET
                status = COALESCE(?, status),
                assigned_responder = COALESCE(?, assigned_responder),
                resolution_notes = COALESCE(?, resolution_notes),
                resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END
            WHERE id = ?
        `, [status, assigned_responder, resolution_notes, status, now, id]);

        if (actual_cost !== undefined) {
            await query('UPDATE emergency_expenses SET actual_cost = ? WHERE emergency_id = ?', [actual_cost, id]);
        }

        // If resolved, restore tourist status to ACTIVE
        if (status === 'RESOLVED') {
            const emgs = await query('SELECT tourist_id FROM emergencies WHERE id = ?', [id]);
            if (emgs && emgs[0]) {
                await query("UPDATE tourists SET status = 'ACTIVE' WHERE id = ?", [emgs[0].tourist_id]);
            }

            if (req.app.get('io')) {
                req.app.get('io').emit('emergency:resolved', { id, timestamp: now });
            }
        }

        res.json({ success: true, message: `Emergency marked as ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
