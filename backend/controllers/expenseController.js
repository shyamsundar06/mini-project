const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

/**
 * Pre-booking Tour Cost Estimator
 */
exports.calculateTourCost = async (req, res) => {
    try {
        const {
            tour_id = null,
            tourist_count = 20,
            transportation_cost = 45000,
            accommodation_cost = 75000,
            food_cost = 40000,
            activity_cost = 20000,
            guide_cost = 15000,
            misc_cost = 5000,
            contingency_percent = 5
        } = req.body;

        const subtotal = Number(transportation_cost) + Number(accommodation_cost) + Number(food_cost) + Number(activity_cost) + Number(guide_cost) + Number(misc_cost);
        const contingency_cost = (subtotal * (Number(contingency_percent) / 100));
        const total_cost = subtotal + contingency_cost;
        const count = Math.max(1, Number(tourist_count));
        const per_person_cost = total_cost / count;

        const recordId = `tc_${uuidv4().substring(0, 8)}`;
        if (tour_id) {
            await query(`
                INSERT INTO tour_costs (id, tour_id, tourist_count, transportation_cost, accommodation_cost, food_cost, activity_cost, guide_cost, misc_cost, contingency_cost, total_cost, per_person_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [recordId, tour_id, count, transportation_cost, accommodation_cost, food_cost, activity_cost, guide_cost, misc_cost, contingency_cost, total_cost, per_person_cost]);
        }

        res.json({
            success: true,
            breakdown: {
                touristCount: count,
                transportationCost: Number(transportation_cost),
                accommodationCost: Number(accommodation_cost),
                foodCost: Number(food_cost),
                activityCost: Number(activity_cost),
                guideCost: Number(guide_cost),
                miscCost: Number(misc_cost),
                contingencyCost: Number(contingency_cost.toFixed(2)),
                totalTourCost: Number(total_cost.toFixed(2)),
                perPersonCost: Number(per_person_cost.toFixed(2))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Emergency Expense Estimator
 */
exports.estimateEmergencyExpense = async (req, res) => {
    try {
        const { distance_km = 12, transport_type = 'Emergency Rapid Vehicle', available_reserve = 25000 } = req.body;

        const dist = Number(distance_km);
        const reserve = Number(available_reserve);
        const base = 900;
        const ratePerKm = 65;
        const kit = 500;

        const calculated = base + (dist * ratePerKm) + kit;
        const minCost = Math.round(calculated * 0.85);
        const maxCost = Math.round(calculated * 1.3);
        const remainingMin = Math.max(0, reserve - maxCost);
        const remainingMax = Math.max(0, reserve - minCost);

        res.json({
            success: true,
            estimate: {
                estimatedDistanceKm: dist,
                transportType: transport_type,
                estimatedCostRange: {
                    min: minCost,
                    max: maxCost,
                    formatted: `₹${minCost.toLocaleString()} – ₹${maxCost.toLocaleString()}`
                },
                availableEmergencyReserve: reserve,
                remainingReserveRange: {
                    min: remainingMin,
                    max: remainingMax,
                    formatted: `₹${remainingMin.toLocaleString()} – ₹${remainingMax.toLocaleString()}`
                },
                disclaimer: 'This is an approximate operational estimate, not an exact medical or financial prediction.'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
