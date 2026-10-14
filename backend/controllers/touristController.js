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
            WHERE t.status != 'DELETED'
            ORDER BY t.created_at DESC, t.id DESC
        `);

        // Deduplicate by name (case-insensitive) so the same person is never returned twice
        const seen = new Set();
        const unique = [];
        for (const t of tourists) {
            const clean = t.name ? t.name.toLowerCase().trim() : '';
            if (clean && !seen.has(clean)) {
                seen.add(clean);
                unique.push(t);
            }
        }

        res.json({ success: true, tourists: unique });
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

        let assignedGroupId = group_id;
        if (!assignedGroupId || assignedGroupId === '') {
            // Automatically find group with fewest members to balance groups
            const availableGroups = await query(`
                SELECT g.id, COUNT(gm.id) as member_count 
                FROM groups g
                LEFT JOIN group_members gm ON g.id = gm.group_id
                WHERE g.tour_id = ?
                GROUP BY g.id
                ORDER BY member_count ASC, g.name ASC
            `, [tour_id]);

            if (availableGroups && availableGroups.length > 0) {
                assignedGroupId = availableGroups[0].id;
            } else {
                assignedGroupId = 'grp_alpha';
            }
        }

        // Check if tourist with same name already exists in tour
        const existing = await query(
            'SELECT id FROM tourists WHERE LOWER(name) = ?',
            [name.toLowerCase().trim()]
        );

        let touristId;
        if (existing && existing.length > 0) {
            touristId = existing[0].id;
            await query(
                `UPDATE tourists SET 
                    tour_id = ?,
                    group_id = ?,
                    name = ?,
                    age = ?,
                    gender = ?,
                    preferred_language = ?,
                    walking_preference = ?,
                    activity_preference = ?,
                    interests = ?,
                    accessibility_requirements = ?,
                    emergency_contact_name = ?,
                    emergency_contact_phone = ?,
                    status = 'ACTIVE',
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    tour_id, assignedGroupId, name, age, gender,
                    preferred_language, walking_preference, activity_preference,
                    interests, accessibility_requirements,
                    emergency_contact_name || 'Emergency Contact',
                    emergency_contact_phone || '+91 98451 00000',
                    touristId
                ]
            );
        } else {
            touristId = `trt_${uuidv4().substring(0, 8)}`;
            await query(
                `INSERT INTO tourists (id, tour_id, group_id, name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name, emergency_contact_phone, current_latitude, current_longitude, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [touristId, tour_id, assignedGroupId, name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name || 'Emergency Contact', emergency_contact_phone || '+91 98451 00000', 11.4190, 76.7112, 'ACTIVE']
            );
        }

        // Add preferences (delete any existing preference first to prevent UNIQUE constraint errors)
        await query('DELETE FROM tourist_preferences WHERE tourist_id = ?', [touristId]);
        const prefId = `pref_${uuidv4().substring(0, 8)}`;
        await query(
            `INSERT INTO tourist_preferences (id, tourist_id, pace_level, dietary_pref, physical_ability, budget_tier, special_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [prefId, touristId, 3, dietary_pref, 'Good', 'Standard', special_notes || '']
        );

        // Add to group_members
        if (assignedGroupId) {
            await query('DELETE FROM group_members WHERE tourist_id = ?', [touristId]);
            const gmId = `gm_${uuidv4().substring(0, 8)}`;
            await query(
                `INSERT INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)`,
                [gmId, assignedGroupId, touristId, 90]
            );
        }

        // Emit real-time updates
        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                const io = req.app.get('io');
                io.emit('tourist:new', { id: touristId, name, groupId: assignedGroupId, tourId: tour_id });
                io.emit('group:update', { tour_id });
            }
        } catch (ioErr) {
            console.warn('[TouristController] Socket emit error:', ioErr.message);
        }

        res.status(201).json({ success: true, message: 'Tourist added successfully', touristId, groupId: assignedGroupId });
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

        // Fetch tourist metadata for real-time notification
        let tRows = await query('SELECT id, tour_id, name, group_id, user_id FROM tourists WHERE id = ?', [id]);
        if (!tRows || tRows.length === 0) {
            tRows = await query('SELECT id, tour_id, name, group_id, user_id FROM tourists WHERE LOWER(name) = ?', [id.toLowerCase().trim()]);
        }
        
        const realTouristId = tRows[0]?.id || id;
        const touristName = tRows[0]?.name;
        const tourId = tRows[0]?.tour_id || 'tour_ooty_nilgiris';

        // Safe cascade deletions for all matches
        const idsToDelete = Array.from(new Set([realTouristId, id].filter(Boolean)));
        for (const tid of idsToDelete) {
            try { await query('DELETE FROM group_members WHERE tourist_id = ?', [tid]); } catch (e) {}
            try { await query('DELETE FROM tourist_preferences WHERE tourist_id = ?', [tid]); } catch (e) {}
            try { await query('DELETE FROM tourist_locations WHERE tourist_id = ?', [tid]); } catch (e) {}
            try { await query('DELETE FROM emergencies WHERE tourist_id = ?', [tid]); } catch (e) {}
            try { await query('DELETE FROM broadcast_acks WHERE tourist_id = ?', [tid]); } catch (e) {}
            try { await query('DELETE FROM tourists WHERE id = ?', [tid]); } catch (e) {}
        }
        if (touristName) {
            try { await query('DELETE FROM tourist_feedback WHERE tourist_name = ?', [touristName]); } catch (e) {}
            try { await query('DELETE FROM tourists WHERE LOWER(name) = ?', [touristName.toLowerCase().trim()]); } catch (e) {}
        }

        // 8. Emit real-time deletion events
        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                const io = req.app.get('io');
                io.emit('tourist:deleted', { id: realTouristId, name: touristName, tourId });
                io.emit('group:update', { tour_id: tourId });
            }
        } catch (ioErr) {
            console.warn('[TouristController] Socket emit error on delete:', ioErr.message);
        }

        res.json({ success: true, message: 'Tourist deleted successfully', id: realTouristId });
    } catch (err) {
        console.error('[TouristController] deleteTourist error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Real-time package booking by tourist with preference assignment and coordinator notification
 */
exports.bookTour = async (req, res) => {
    try {
        const {
            user_id,
            tourist_name = 'Sonika',
            tour_id = 'tour_ooty_nilgiris',
            package_title = 'Nilgiris Grand Heritage & Botanical Discovery',
            duration = '4 Days / 3 Nights',
            language = 'English',
            preferences = {},
            booking_details = {}
        } = req.body;

        const {
            walking_preference = 'Moderate',
            activity_preference = 'Cultural',
            interests = 'Sightseeing, Heritage',
            dietary_pref = 'Vegetarian',
            accessibility_requirements = 'None',
            emergency_contact_name = 'Emergency Contact',
            emergency_contact_phone = '+91 98451 00000'
        } = preferences;

        // 1. Determine tourist ID
        let touristId = user_id ? `trt_${user_id.replace('usr_', '')}` : `trt_${uuidv4().substring(0, 8)}`;

        // 2. Intelligently assign tourist to the best-matching group based on walking pace
        let targetGroupId = 'grp_beta';
        if (walking_preference === 'Fast') targetGroupId = 'grp_alpha';
        else if (walking_preference === 'Slow') targetGroupId = 'grp_gamma';

        const grpCheck = await query('SELECT id, name FROM groups WHERE id = ?', [targetGroupId]);
        const assignedGroupName = grpCheck[0]?.name || 'Group Beta';

        // 3. Upsert into tourists table
        const existingTourist = await query(
            'SELECT id FROM tourists WHERE user_id = ? OR id = ? OR LOWER(name) = ?',
            [user_id, touristId, tourist_name.toLowerCase()]
        );
        if (existingTourist && existingTourist.length > 0) {
            touristId = existingTourist[0].id;
            await query(`
                UPDATE tourists SET 
                    user_id = COALESCE(?, user_id),
                    tour_id = ?,
                    group_id = ?,
                    name = ?,
                    preferred_language = ?,
                    walking_preference = ?,
                    activity_preference = ?,
                    interests = ?,
                    accessibility_requirements = ?,
                    emergency_contact_name = ?,
                    emergency_contact_phone = ?,
                    status = 'ACTIVE',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                user_id || null,
                tour_id, targetGroupId, tourist_name, language,
                walking_preference, activity_preference, interests,
                accessibility_requirements, emergency_contact_name, emergency_contact_phone,
                touristId
            ]);
        } else {
            // Clean up any stale record with same user_id before inserting to avoid UNIQUE constraint violation
            if (user_id) {
                try {
                    await query('DELETE FROM group_members WHERE tourist_id IN (SELECT id FROM tourists WHERE user_id = ?)', [user_id]);
                    await query('DELETE FROM tourist_preferences WHERE tourist_id IN (SELECT id FROM tourists WHERE user_id = ?)', [user_id]);
                    await query('DELETE FROM tourists WHERE user_id = ?', [user_id]);
                } catch (e) {}
            }
            await query(`
                INSERT INTO tourists (
                    id, user_id, tour_id, group_id, name, age, gender,
                    preferred_language, walking_preference, activity_preference,
                    interests, accessibility_requirements, emergency_contact_name,
                    emergency_contact_phone, current_latitude, current_longitude, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
            `, [
                touristId, user_id || null, tour_id, targetGroupId, tourist_name,
                26, 'Female', language, walking_preference, activity_preference,
                interests, accessibility_requirements, emergency_contact_name,
                emergency_contact_phone, 11.4190, 76.7112
            ]);
        }

        // 4. Upsert preferences (clean up old first)
        await query('DELETE FROM tourist_preferences WHERE tourist_id = ?', [touristId]);
        const prefId = `pref_${uuidv4().substring(0, 8)}`;
        await query(`
            INSERT INTO tourist_preferences (id, tourist_id, pace_level, dietary_pref, physical_ability, budget_tier, special_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            prefId, touristId,
            walking_preference === 'Fast' ? 4 : walking_preference === 'Slow' ? 2 : 3,
            dietary_pref, 'Good', 'Standard', `Booked ${package_title} (${duration})`
        ]);

        // 5. Clean up previous group memberships and insert into group_members
        await query('DELETE FROM group_members WHERE tourist_id = ?', [touristId]);
        const gmId = `gm_${uuidv4().substring(0, 8)}`;
        await query(`
            INSERT INTO group_members (id, group_id, tourist_id, compatibility_score)
            VALUES (?, ?, ?, 95)
        `, [gmId, targetGroupId, touristId]);

        // 6. Record notification for Operator Dashboard
        const notifId = `notif_${uuidv4().substring(0, 8)}`;
        const notifTitle = `🎟️ New Booking: ${tourist_name}`;
        const notifMsg = `${tourist_name} booked package "${package_title}" (${duration}) [${booking_details?.total_amount || ''} incl. ₹2,000 refundable Emergency Medical Services deposit]. Automatically assigned to ${assignedGroupName}.`;
        await query(`
            INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
            VALUES (?, NULL, ?, ?, 'BOOKING', 0, CURRENT_TIMESTAMP)
        `, [notifId, notifTitle, notifMsg]);

        // 7. Real-Time WebSocket Broadcast to Operator Dashboard
        try {
            if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
                const io = req.app.get('io');
                const bookingPayload = {
                    id: notifId,
                    touristId,
                    tourist_id: touristId,
                    touristName: tourist_name,
                    tourist_name: tourist_name,
                    tourId: tour_id,
                    tour_id: tour_id,
                    packageTitle: package_title,
                    package_title: package_title,
                    duration,
                    groupName: assignedGroupName,
                    assigned_group: assignedGroupName,
                    groupId: targetGroupId,
                    group_id: targetGroupId,
                    walkingPreference: walking_preference,
                    language,
                    base_price: booking_details?.base_price || '',
                    emergency_medical_deposit: booking_details?.emergency_medical_deposit || '₹2,000',
                    total_amount: booking_details?.total_amount || '',
                    medical_refund_note: 'Refundable after trip if not used',
                    preferences: {
                        walking_preference,
                        dietary_pref
                    },
                    timestamp: new Date().toISOString()
                };
                io.emit('booking:new', bookingPayload);
                io.emit('tourist:new', bookingPayload);
                io.emit('group:update', { tour_id });
                io.emit('notification:new', {
                    id: notifId,
                    title: notifTitle,
                    message: notifMsg,
                    time: 'Just now'
                });
            }
        } catch (ioErr) {
            console.warn('[TouristController] Socket emit error:', ioErr.message);
        }

        res.status(201).json({
            success: true,
            message: `Congratulations ${tourist_name}! Your booking for ${package_title} is confirmed.`,
            bookingId: `BK-${Date.now().toString().slice(-6)}`,
            touristId,
            assignedGroup: {
                id: targetGroupId,
                name: assignedGroupName
            },
            booking: {
                booking_id: `BK-${Date.now().toString().slice(-6)}`,
                tourist_name,
                package_title,
                duration,
                assigned_group: assignedGroupName,
                places: req.body.booking_details?.places || [],
                base_price: booking_details?.base_price || '',
                emergency_medical_deposit: booking_details?.emergency_medical_deposit || '₹2,000',
                total_amount: booking_details?.total_amount || '',
                medical_refund_note: 'Refundable after trip if not used'
            }
        });
    } catch (err) {
        console.error('[TouristController] bookTour error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

