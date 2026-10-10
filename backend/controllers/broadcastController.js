const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

let tableChecked = false;

async function ensureTable() {
    if (tableChecked) return;
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS broadcasts (
                id TEXT PRIMARY KEY,
                tour_id TEXT NOT NULL,
                target_group TEXT NOT NULL DEFAULT 'ALL',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'NORMAL',
                sender_name TEXT NOT NULL DEFAULT 'Tour Command Center',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS broadcast_acks (
                id TEXT PRIMARY KEY,
                broadcast_id TEXT NOT NULL,
                tourist_id TEXT NOT NULL,
                tourist_name TEXT,
                acked_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if any sample broadcast exists, seed if empty
        const existing = await query("SELECT COUNT(*) as count FROM broadcasts");
        const count = existing[0]?.count || existing[0]?.['COUNT(*)'] || 0;
        if (count === 0) {
            await query(`
                INSERT INTO broadcasts (id, tour_id, target_group, title, message, priority, sender_name, created_at)
                VALUES 
                ('bc_1', 'tour_ooty_nilgiris', 'ALL', 'Tour Assembly Notice', 'All groups please regroup near Italian Terraced Garden gazebo by 11:30 AM for group photo.', 'NORMAL', 'Command Center', datetime('now', '-30 minutes')),
                ('bc_2', 'tour_ooty_nilgiris', 'grp_alpha', 'Pace Coordination', 'Alpha Trekkers: Rain clouds spotted on Doddabetta. Rain gear distribution at lower gate.', 'HIGH', 'Vikram Anand (Lead)', datetime('now', '-10 minutes'))
            `);
        }

        tableChecked = true;
    } catch (err) {
        console.error('[BroadcastController] Table init error:', err.message);
    }
}

exports.getBroadcasts = async (req, res) => {
    try {
        await ensureTable();
        const { tour_id = 'tour_ooty_nilgiris', group_id } = req.query;

        let sql = `
            SELECT b.*, 
                   COUNT(a.id) as ack_count
            FROM broadcasts b
            LEFT JOIN broadcast_acks a ON b.id = a.broadcast_id
            WHERE b.tour_id = ?
        `;
        const params = [tour_id];

        if (group_id && group_id !== 'ALL') {
            sql += ` AND (b.target_group = 'ALL' OR b.target_group = ?)`;
            params.push(group_id);
        }

        sql += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT 30`;

        const broadcasts = await query(sql, params);
        res.json({ success: true, broadcasts });
    } catch (err) {
        console.error('[BroadcastController] getBroadcasts error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createBroadcast = async (req, res) => {
    try {
        await ensureTable();
        const {
            tour_id = 'tour_ooty_nilgiris',
            target_group = 'ALL',
            title,
            message,
            priority = 'NORMAL',
            sender_name = 'Tour Command Center'
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const id = `bc_${Date.now()}`;
        const now = new Date().toISOString();

        await query(`
            INSERT INTO broadcasts (id, tour_id, target_group, title, message, priority, sender_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, tour_id, target_group, title, message, priority, sender_name, now]);

        const newBroadcast = {
            id,
            tour_id,
            target_group,
            title,
            message,
            priority,
            sender_name,
            created_at: now,
            ack_count: 0
        };

        // Real-Time WebSocket broadcast to all connected tourists and dashboards
        const io = req.app.get('io');
        if (io) {
            io.emit('broadcast:new', newBroadcast);
        }

        res.json({ success: true, broadcast: newBroadcast });
    } catch (err) {
        console.error('[BroadcastController] createBroadcast error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.acknowledgeBroadcast = async (req, res) => {
    try {
        await ensureTable();
        const { id } = req.params;
        const { tourist_id = 'trt_1', tourist_name = 'Rahul Kumar' } = req.body;

        // Check if already acknowledged
        const existing = await query(
            "SELECT id FROM broadcast_acks WHERE broadcast_id = ? AND tourist_id = ?",
            [id, tourist_id]
        );

        if (!existing || existing.length === 0) {
            const ackId = `ack_${uuidv4().substring(0, 8)}`;
            await query(
                "INSERT INTO broadcast_acks (id, broadcast_id, tourist_id, tourist_name, acked_at) VALUES (?, ?, ?, ?, ?)",
                [ackId, id, tourist_id, tourist_name, new Date().toISOString()]
            );
        }

        // Emit ack update to operator dashboard
        const io = req.app.get('io');
        if (io) {
            io.emit('broadcast:ack', {
                broadcast_id: id,
                tourist_id,
                tourist_name
            });
        }

        res.json({ success: true, message: 'Broadcast acknowledged.' });
    } catch (err) {
        console.error('[BroadcastController] acknowledgeBroadcast error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
