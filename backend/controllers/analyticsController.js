const { query } = require('../config/db');

// Ensure feedback table exists
const initFeedbackTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS tourist_feedback (
                id TEXT PRIMARY KEY,
                tour_id TEXT,
                tourist_name TEXT,
                rating INTEGER,
                guide_rating INTEGER,
                safety_rating INTEGER,
                scenery_rating INTEGER,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if seeded
        const existing = await query('SELECT COUNT(*) as count FROM tourist_feedback');
        if (existing[0]?.count === 0) {
            const seedReviews = [
                {
                    id: 'rev_1',
                    tour_id: 'tour_ooty_nilgiris',
                    tourist_name: 'Priya Sharma (Group Alpha)',
                    rating: 5,
                    guide_rating: 5,
                    safety_rating: 5,
                    scenery_rating: 5,
                    comment: 'Incredible botanical walk! The real-time guide audio and stray alerts gave us complete peace of mind with our kids.'
                },
                {
                    id: 'rev_2',
                    tour_id: 'tour_ooty_nilgiris',
                    tourist_name: 'David Wilson (Group Beta)',
                    rating: 5,
                    guide_rating: 5,
                    safety_rating: 4,
                    scenery_rating: 5,
                    comment: 'The multilingual AI assistant translated everything into French flawlessly. Tea museum route was breathtaking.'
                },
                {
                    id: 'rev_3',
                    tour_id: 'tour_ooty_nilgiris',
                    tourist_name: 'Kavita Nair (Group Gamma)',
                    rating: 4,
                    guide_rating: 5,
                    safety_rating: 5,
                    scenery_rating: 4,
                    comment: 'Well organized micro-group grouping. The pace matched our elderly parents perfectly.'
                }
            ];

            for (const r of seedReviews) {
                await query(
                    `INSERT INTO tourist_feedback (id, tour_id, tourist_name, rating, guide_rating, safety_rating, scenery_rating, comment)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [r.id, r.tour_id, r.tourist_name, r.rating, r.guide_rating, r.safety_rating, r.scenery_rating, r.comment]
                );
            }
        }
    } catch (e) {
        console.error('Failed to init tourist_feedback table:', e);
    }
};

initFeedbackTable();

exports.getAnalytics = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;

        // 1. Overview counts
        const totalTouristsRes = await query('SELECT COUNT(*) as count FROM tourists');
        const activeGroupsRes = await query("SELECT COUNT(*) as count FROM groups WHERE status = 'ACTIVE'");
        const activeToursRes = await query("SELECT COUNT(*) as count FROM tours WHERE status = 'ACTIVE'");
        const totalEmergenciesRes = await query('SELECT COUNT(*) as count FROM emergencies');
        const activeEmergenciesRes = await query("SELECT COUNT(*) as count FROM emergencies WHERE status IN ('ACTIVE', 'INVESTIGATING')");

        // 2. Language distribution
        const languageStats = await query(`
            SELECT preferred_language as name, COUNT(*) as value 
            FROM tourists 
            GROUP BY preferred_language
        `);

        // 3. Walking Preference distribution
        const walkingStats = await query(`
            SELECT walking_preference as name, COUNT(*) as value 
            FROM tourists 
            GROUP BY walking_preference
        `);

        // 4. Group compatibility & size
        const groupStats = await query(`
            SELECT g.name, g.compatibility_score as score, COUNT(gm.tourist_id) as memberCount, g.color_hex as color
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            GROUP BY g.id
        `);

        // 5. AI Recommendation Acceptance Rate
        const aiTotal = await query('SELECT COUNT(*) as count FROM ai_recommendations');
        const aiApproved = await query("SELECT COUNT(*) as count FROM ai_recommendations WHERE status = 'APPROVED'");
        const aiRejected = await query("SELECT COUNT(*) as count FROM ai_recommendations WHERE status = 'REJECTED'");
        const aiPending = await query("SELECT COUNT(*) as count FROM ai_recommendations WHERE status = 'PENDING'");

        const totalRecs = aiTotal[0]?.count || 1;
        const approvedCount = aiApproved[0]?.count || 0;
        const acceptanceRate = Math.round((approvedCount / (approvedCount + (aiRejected[0]?.count || 0) || 1)) * 100);

        // 6. Tour Expense Breakdown
        const costEstimate = await query('SELECT * FROM tour_costs ORDER BY created_at DESC LIMIT 1');
        const cost = costEstimate[0] || {
            transportation_cost: 42000,
            accommodation_cost: 68000,
            food_cost: 36000,
            activity_cost: 18400,
            guide_cost: 12000,
            misc_cost: 4600,
            contingency_cost: 10000,
            total_cost: 191000,
            per_person_cost: 11937.5
        };

        const expenseCategories = [
            { name: 'Accommodation', value: Number(cost.accommodation_cost), color: '#3B82F6' },
            { name: 'Transportation', value: Number(cost.transportation_cost), color: '#10B981' },
            { name: 'Food & Dining', value: Number(cost.food_cost), color: '#F59E0B' },
            { name: 'Activities & Entry', value: Number(cost.activity_cost), color: '#8B5CF6' },
            { name: 'Guides & Support', value: Number(cost.guide_cost), color: '#EC4899' },
            { name: 'Contingency Reserve', value: Number(cost.contingency_cost), color: '#6366F1' }
        ];

        // 7. Activity Timeline Completion Status
        const activityCompletion = [
            { hour: '08:00', status: 'Breakfast Briefing', completed: 100 },
            { hour: '10:00', status: 'Botanical Gardens', completed: 85 },
            { hour: '12:30', status: 'Regional Lunch', completed: 0 },
            { hour: '14:00', status: 'Tea Museum / Cinema', completed: 0 },
            { hour: '16:00', status: 'Artisan Chocolate', completed: 0 },
            { hour: '18:00', status: 'Lake Boating', completed: 0 }
        ];

        // 8. Tourist Ratings & Feedback
        const feedbackList = await query('SELECT * FROM tourist_feedback ORDER BY created_at DESC LIMIT 10');
        const avgRatingsRes = await query(`
            SELECT 
                AVG(rating) as avgOverall,
                AVG(guide_rating) as avgGuide,
                AVG(safety_rating) as avgSafety,
                AVG(scenery_rating) as avgScenery,
                COUNT(*) as totalReviews
            FROM tourist_feedback
        `);

        const avgStats = avgRatingsRes[0] || {};

        res.json({
            success: true,
            summary: {
                totalTourists: totalTouristsRes[0]?.count || 16,
                activeGroups: activeGroupsRes[0]?.count || 3,
                activeTours: activeToursRes[0]?.count || 1,
                totalEmergencies: totalEmergenciesRes[0]?.count || 1,
                activeEmergencies: activeEmergenciesRes[0]?.count || 0,
                avgResponseTimeMinutes: 6.5,
                aiAcceptanceRate: acceptanceRate || 92,
                totalTourRevenue: 191000,
                customerSatisfactionScore: Number(avgStats.avgOverall || 4.8).toFixed(1)
            },
            feedback: {
                summary: {
                    overall: Number(avgStats.avgOverall || 4.8).toFixed(1),
                    guide: Number(avgStats.avgGuide || 4.9).toFixed(1),
                    safety: Number(avgStats.avgSafety || 4.9).toFixed(1),
                    scenery: Number(avgStats.avgScenery || 4.7).toFixed(1),
                    totalCount: avgStats.totalReviews || 3
                },
                reviews: feedbackList || []
            },
            languageStats,
            walkingStats,
            groupStats,
            aiStats: {
                total: totalRecs,
                approved: approvedCount,
                rejected: aiRejected[0]?.count || 0,
                pending: aiPending[0]?.count || 0,
                acceptanceRate
            },
            expenseCategories,
            activityCompletion
        });
    } catch (err) {
        console.error('[AnalyticsController] getAnalytics error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const {
            tour_id = 'tour_ooty_nilgiris',
            tourist_name = 'Anonymous Tourist',
            rating = 5,
            guide_rating = 5,
            safety_rating = 5,
            scenery_rating = 5,
            comment = ''
        } = req.body;

        const id = `rev_${Date.now()}`;
        await query(
            `INSERT INTO tourist_feedback (id, tour_id, tourist_name, rating, guide_rating, safety_rating, scenery_rating, comment)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tour_id, tourist_name, rating, guide_rating, safety_rating, scenery_rating, comment]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: { id, tour_id, tourist_name, rating, guide_rating, safety_rating, scenery_rating, comment }
        });
    } catch (err) {
        console.error('[AnalyticsController] submitFeedback error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
