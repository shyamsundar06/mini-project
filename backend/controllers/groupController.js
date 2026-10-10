const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const groupAgent = require('../agents/GroupAgent');

exports.getAllGroups = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;
        const groups = await query('SELECT * FROM groups WHERE tour_id = ? ORDER BY name ASC', [tour_id]);

        const enriched = await Promise.all(groups.map(async (grp) => {
            const members = await query(`
                SELECT t.id, t.name, t.age, t.preferred_language, t.walking_preference, t.activity_preference, t.accessibility_requirements, t.interests, t.status, gm.compatibility_score
                FROM group_members gm
                JOIN tourists t ON gm.tourist_id = t.id
                WHERE gm.group_id = ?
            `, [grp.id]);

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

/**
 * Run AI Grouping Engine without applying immediately
 */
exports.generateAIGroups = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.body;
        const tourists = await query('SELECT * FROM tourists WHERE tour_id = ? OR tour_id IS NULL', [tour_id]);

        const clusters = groupAgent.clusterTourists(tourists);

        res.json({
            success: true,
            tour_id,
            recommendedGroups: clusters,
            totalTourists: tourists.length,
            message: 'Adaptive AI clustering completed. Ready for operator approval.'
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
            const tourists = await query('SELECT * FROM tourists WHERE tour_id = ?', [tour_id]);
            clusters = groupAgent.clusterTourists(tourists);
        }

        // Clear existing group members for the tour
        const existingGroups = await query('SELECT id FROM groups WHERE tour_id = ?', [tour_id]);
        for (const eg of existingGroups) {
            await query('DELETE FROM group_members WHERE group_id = ?', [eg.id]);
        }

        // Upsert groups and insert group_members
        for (const cluster of clusters) {
            const grpId = cluster.id || `grp_${uuidv4().substring(0, 8)}`;
            await query(`
                INSERT INTO groups (id, tour_id, name, leader_name, leader_phone, color_hex, walking_preference, avg_age, common_interests, compatibility_score, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                    name=excluded.name,
                    leader_name=excluded.leader_name,
                    walking_preference=excluded.walking_preference,
                    avg_age=excluded.avg_age,
                    compatibility_score=excluded.compatibility_score
            `, [
                grpId, tour_id, cluster.name, cluster.leader_name || 'Assigned Guide',
                cluster.leader_phone || '+91 98451 00000', cluster.color_hex || '#3B82F6',
                cluster.walking_preference || 'Moderate', cluster.avg_age || 30,
                cluster.common_interests || 'General', cluster.compatibility_score || 90, 'ACTIVE'
            ]);

            // Assign tourists to this group
            for (const member of cluster.members || []) {
                const gmId = `gm_${uuidv4().substring(0, 8)}`;
                await query('INSERT OR REPLACE INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)',
                    [gmId, grpId, member.id, member.individualScore || cluster.compatibility_score || 90]);

                await query('UPDATE tourists SET group_id = ? WHERE id = ?', [grpId, member.id]);
            }
        }

        // Broadcast real-time socket event if IO available
        if (req.app.get('io')) {
            req.app.get('io').emit('group:update', { tour_id, timestamp: new Date().toISOString() });
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

        if (req.app.get('io')) {
            req.app.get('io').emit('group:update', { tourist_id, target_group_id });
        }

        res.json({ success: true, message: 'Tourist successfully moved.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
