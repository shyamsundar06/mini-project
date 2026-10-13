const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const groupAgent = require('../agents/GroupAgent');

/**
 * Persist clustered groups and member associations to the database
 */
async function persistClusters(tour_id, clusters) {
    if (!clusters || clusters.length === 0) return;

    // Remove old group memberships for groups of this tour
    const existingGroups = await query('SELECT id FROM groups WHERE tour_id = ?', [tour_id]);
    for (const eg of existingGroups) {
        await query('DELETE FROM group_members WHERE group_id = ?', [eg.id]);
    }

    // Upsert each group and insert member associations
    for (const cluster of clusters) {
        const grpId = cluster.id || `grp_${uuidv4().substring(0, 8)}`;

        const existing = await query('SELECT id FROM groups WHERE id = ?', [grpId]);
        if (existing && existing.length > 0) {
            await query(`
                UPDATE groups SET 
                    name = ?, 
                    leader_name = ?, 
                    walking_preference = ?, 
                    avg_age = ?, 
                    compatibility_score = ?, 
                    color_hex = ?,
                    common_interests = ?
                WHERE id = ?
            `, [
                cluster.name,
                cluster.leader_name || 'Assigned Guide',
                cluster.walking_preference || 'Moderate',
                cluster.avg_age || 30,
                cluster.compatibility_score || 90,
                cluster.color_hex || '#3B82F6',
                cluster.common_interests || 'General',
                grpId
            ]);
        } else {
            await query(`
                INSERT INTO groups (id, tour_id, name, leader_name, leader_phone, color_hex, walking_preference, avg_age, common_interests, compatibility_score, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                grpId,
                tour_id,
                cluster.name,
                cluster.leader_name || 'Assigned Guide',
                cluster.leader_phone || '+91 98451 00000',
                cluster.color_hex || '#3B82F6',
                cluster.walking_preference || 'Moderate',
                cluster.avg_age || 30,
                cluster.common_interests || 'General',
                cluster.compatibility_score || 90,
                'ACTIVE'
            ]);
        }

        // Insert every member and update tourists.group_id
        for (const member of cluster.members || []) {
            const gmId = `gm_${uuidv4().substring(0, 8)}`;
            await query(
                'INSERT INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)',
                [gmId, grpId, member.id, member.individualScore || cluster.compatibility_score || 90]
            );

            await query(
                'UPDATE tourists SET group_id = ?, tour_id = ? WHERE id = ?',
                [grpId, tour_id, member.id]
            );
        }
    }
}

exports.getAllGroups = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;

        // Auto-heal check: ensure any tourists with a group_id have group_members record
        await query(`
            INSERT OR IGNORE INTO group_members (id, group_id, tourist_id, compatibility_score)
            SELECT 'gm_' || SUBSTR(id, 5), group_id, id, 90
            FROM tourists
            WHERE group_id IS NOT NULL AND group_id != ''
              AND id NOT IN (SELECT tourist_id FROM group_members)
        `);

        const groups = await query('SELECT * FROM groups WHERE tour_id = ? ORDER BY name ASC', [tour_id]);

        const enriched = await Promise.all(groups.map(async (grp) => {
            const members = await query(`
                SELECT DISTINCT t.id, t.name, t.age, t.preferred_language, t.walking_preference, t.activity_preference, t.accessibility_requirements, t.interests, t.status, COALESCE(gm.compatibility_score, 90) as compatibility_score
                FROM tourists t
                LEFT JOIN group_members gm ON t.id = gm.tourist_id
                WHERE (t.group_id = ? OR gm.group_id = ?) AND (t.status IS NULL OR t.status != 'DELETED')
                ORDER BY t.name ASC
            `, [grp.id, grp.id]);

            return {
                ...grp,
                size: members.length,
                members
            };
        }));

        res.json({ success: true, groups: enriched });
    } catch (err) {
        console.error('[GroupController] getAllGroups error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStrategies = async (req, res) => {
    try {
        res.json({ success: true, strategies: groupAgent.getStrategies() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Run AI Grouping Engine and immediately synchronize to database
 */
exports.generateAIGroups = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris', strategy_id, iteration } = req.body;
        const tourists = await query('SELECT * FROM tourists WHERE tour_id = ? OR tour_id IS NULL OR tour_id = ""', [tour_id]);

        const result = groupAgent.clusterTourists(tourists, strategy_id, iteration);

        // Immediately persist so the new tourist is NEVER lost when leaving the tab
        await persistClusters(tour_id, result.groups);

        // Broadcast real-time socket event if IO available
        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                req.app.get('io').emit('group:update', { tour_id, timestamp: new Date().toISOString() });
            }
        } catch (ioErr) {
            console.warn('[GroupController] Socket emit notice:', ioErr.message);
        }

        res.json({
            success: true,
            tour_id,
            recommendedGroups: result.groups,
            strategyId: result.strategyId,
            strategyName: result.strategyName,
            strategyBadge: result.strategyBadge,
            strategyDescription: result.strategyDescription,
            totalTourists: tourists.length,
            message: `Adaptive AI clustering completed using ${result.strategyName} and saved.`
        });
    } catch (err) {
        console.error('[GroupController] generateAIGroups error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Apply and save AI Grouping to Database
 */
exports.approveAIGroups = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris', groups = [] } = req.body;

        let clusters = groups;
        if (!clusters || clusters.length === 0) {
            const tourists = await query('SELECT * FROM tourists WHERE tour_id = ? OR tour_id IS NULL OR tour_id = ""', [tour_id]);
            const result = groupAgent.clusterTourists(tourists);
            clusters = result.groups;
        }

        await persistClusters(tour_id, clusters);

        // Broadcast real-time socket event if IO available
        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                req.app.get('io').emit('group:update', { tour_id, timestamp: new Date().toISOString() });
            }
        } catch (ioErr) {
            console.warn('[GroupController] Socket emit notice:', ioErr.message);
        }

        res.json({
            success: true,
            message: 'Adaptive AI groups successfully applied and synchronized.'
        });
    } catch (err) {
        console.error('[GroupController] approveAIGroups error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Move a tourist from one group to another manually
 */
exports.moveTourist = async (req, res) => {
    try {
        const { tourist_id, source_group_id, target_group_id } = req.body;
        if (!tourist_id || !target_group_id) {
            return res.status(400).json({ success: false, message: 'Tourist ID and target group ID are required' });
        }

        if (source_group_id) {
            await query('DELETE FROM group_members WHERE group_id = ? AND tourist_id = ?', [source_group_id, tourist_id]);
        }

        const gmId = `gm_${uuidv4().substring(0, 8)}`;
        await query('INSERT OR REPLACE INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)',
            [gmId, target_group_id, tourist_id, 88]);

        await query('UPDATE tourists SET group_id = ? WHERE id = ?', [target_group_id, tourist_id]);

        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                req.app.get('io').emit('group:update', { tourist_id, target_group_id });
            }
        } catch (ioErr) {
            // Ignore socket warning
        }

        res.json({ success: true, message: 'Tourist successfully moved.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
