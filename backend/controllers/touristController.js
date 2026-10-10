const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

exports.getAllTourists = async (req, res) => {
    try {
        const tourists = await query(`
            SELECT t.*, 
                   g.name as group_name, g.color_hex as group_color,
                   tr.title as tour_title,
                   tp.pace_level, tp.dietary_pref, tp.physical_ability, tp.budget_tier, tp.special_notes
            FROM tourists t
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN tours tr ON t.tour_id = tr.id
            LEFT JOIN tourist_preferences tp ON t.id = tp.tourist_id
            ORDER BY t.name ASC
        `);
        res.json({ success: true, tourists });
    } catch (err) {
        console.error('[TouristController] getAllTourists error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTouristById = async (req, res) => {
    try {
        const { id } = req.params;
        const tourists = await query(`
            SELECT t.*, 
                   g.name as group_name, g.color_hex as group_color,
                   tr.title as tour_title,
                   tp.pace_level, tp.dietary_pref, tp.physical_ability, tp.budget_tier, tp.special_notes
            FROM tourists t
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN tours tr ON t.tour_id = tr.id
            LEFT JOIN tourist_preferences tp ON t.id = tp.tourist_id
            WHERE t.id = ?
        `, [id]);

        if (!tourists || tourists.length === 0) {
            return res.status(404).json({ success: false, message: 'Tourist not found' });
        }

        const emergencies = await query('SELECT * FROM emergencies WHERE tourist_id = ? ORDER BY reported_at DESC', [id]);
        const breadcrumbs = await query('SELECT * FROM tourist_locations WHERE tourist_id = ? ORDER BY timestamp DESC LIMIT 20', [id]);

        res.json({
            success: true,
            tourist: {
                ...tourists[0],
                emergencies,
                breadcrumbs
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createTourist = async (req, res) => {
    try {
        const {
            name,
            age = 30,
            gender = 'Other',
            preferred_language = 'English',
            walking_preference = 'Moderate',
            activity_preference = 'Cultural',
            interests = 'Sightseeing',
            accessibility_requirements = 'None',
            emergency_contact_name,
            emergency_contact_phone,
            tour_id = 'tour_ooty_nilgiris',
            group_id = null,
            dietary_pref = 'Vegetarian',
            special_notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Tourist name is required' });
        }

        const touristId = `trt_${uuidv4().substring(0, 8)}`;
        await query(
            `INSERT INTO tourists (id, tour_id, group_id, name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name, emergency_contact_phone, current_latitude, current_longitude, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [touristId, tour_id, group_id, name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name || 'Emergency Contact', emergency_contact_phone || '+91 98451 00000', 11.4190, 76.7112, 'ACTIVE']
        );

        // Add preferences
        const prefId = `pref_${uuidv4().substring(0, 8)}`;
        await query(
            `INSERT INTO tourist_preferences (id, tourist_id, pace_level, dietary_pref, physical_ability, budget_tier, special_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [prefId, touristId, 3, dietary_pref, 'Good', 'Standard', special_notes || '']
        );

        // If assigned to group, add to group_members
        if (group_id) {
            const gmId = `gm_${uuidv4().substring(0, 8)}`;
            await query(
                `INSERT INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)`,
                [gmId, group_id, touristId, 90]
            );
        }

        res.status(201).json({ success: true, message: 'Tourist added successfully', touristId });
    } catch (err) {
        console.error('[TouristController] createTourist error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTourist = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, age, gender, preferred_language, walking_preference,
            activity_preference, interests, accessibility_requirements,
            emergency_contact_name, emergency_contact_phone, tour_id, group_id, status
        } = req.body;

        await query(
            `UPDATE tourists SET 
                name = COALESCE(?, name),
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                preferred_language = COALESCE(?, preferred_language),
                walking_preference = COALESCE(?, walking_preference),
                activity_preference = COALESCE(?, activity_preference),
                interests = COALESCE(?, interests),
                accessibility_requirements = COALESCE(?, accessibility_requirements),
                emergency_contact_name = COALESCE(?, emergency_contact_name),
                emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                tour_id = COALESCE(?, tour_id),
                group_id = COALESCE(?, group_id),
                status = COALESCE(?, status)
             WHERE id = ?`,
            [name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name, emergency_contact_phone, tour_id, group_id, status, id]
        );

        res.json({ success: true, message: 'Tourist updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteTourist = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM tourists WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tourist deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
