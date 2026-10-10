-- =========================================================
-- Intelligent Tourism Management Platform - Seed Data
-- =========================================================

USE `intelligent_tourism_db`;

-- 1. Users (Passwords are hashed for 'Password123!')
-- bcrypt hash for 'Password123!' is $2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2
-- We also support plaintext/auto-hash verification in backend auth
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`) VALUES
('usr_operator_1', 'Vikram Anand', 'operator@tourism.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'operator', '+91 98765 43210'),
('usr_tourist_1', 'Rahul Kumar', 'rahul.kumar@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 12345'),
('usr_tourist_2', 'Priya Sharma', 'priya.sharma@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 23456'),
('usr_tourist_3', 'Arun Swaminathan', 'arun.swami@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 34567'),
('usr_tourist_4', 'Deepa Nair', 'deepa.nair@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 45678'),
('usr_tourist_5', 'Kavitha Reddy', 'kavitha.reddy@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 56789'),
('usr_tourist_6', 'Suresh Hegde', 'suresh.hegde@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 67890'),
('usr_tourist_7', 'Ananya Patel', 'ananya.p@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 78901'),
('usr_tourist_8', 'Rohan Mehra', 'rohan.m@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 89012'),
('usr_tourist_9', 'Meera Subramanian', 'meera.sub@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 90123'),
('usr_tourist_10', 'Karthik Raja', 'karthik.r@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98451 01234'),
('usr_tourist_11', 'Neha Verma', 'neha.v@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 11223'),
('usr_tourist_12', 'Girish Kulkarni', 'girish.k@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 22334'),
('usr_tourist_13', 'Sneha Menon', 'sneha.m@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 33445'),
('usr_tourist_14', 'Venkatesh Rao', 'venky.rao@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 44556'),
('usr_tourist_15', 'Divya Balaji', 'divya.b@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 55667'),
('usr_tourist_16', 'Amitabh Sen', 'amitabh.s@gmail.com', '$2a$10$wNqv4t03m.w3j3tB830gQeM/9Q09i2B3Gq48k0mD6J7qN7r4S1U/2', 'tourist', '+91 98452 66778');

-- 2. Operator Profile
INSERT INTO `operators` (`id`, `user_id`, `company_name`, `license_number`, `emergency_hotline`) VALUES
('op_1', 'usr_operator_1', 'Nilgiri Heritage Eco Tours Pvt Ltd', 'TN-TO-2024-8849', '+91 800 112 3344');

-- 3. Tours
INSERT INTO `tours` (`id`, `operator_id`, `title`, `description`, `start_date`, `end_date`, `budget`, `max_capacity`, `status`, `primary_destination`) VALUES
('tour_ooty_nilgiris', 'op_1', 'Nilgiris Grand Heritage & Botanical Discovery', 'An immersive 4-day premium exploration of Ooty, Doddabetta Peak, Tea Factory & Heritage Toy Train with dynamic AI itinerary adaptations.', '2026-09-01', '2026-09-04', 185000.00, 25, 'ACTIVE', 'Ooty & Nilgiri Hills, Tamil Nadu'),
('tour_kodaikanal', 'op_1', 'Kodaikanal Mist & Pine Valley Expedition', '3-day nature retreat covering Pillar Rocks, Coakers Walk, Berijam Lake and organic tea plantations.', '2026-09-15', '2026-09-18', 140000.00, 20, 'PLANNING', 'Kodaikanal, Tamil Nadu');

-- 4. Destinations
INSERT INTO `destinations` (`id`, `tour_id`, `name`, `description`, `latitude`, `longitude`, `order_index`, `arrival_time`, `departure_time`) VALUES
('dest_1', 'tour_ooty_nilgiris', 'Ooty Botanical Gardens', '55-acre terraced garden established in 1848 with rare tree fossils & exotic flora.', 11.4190, 76.7112, 1, '09:30 AM', '12:00 PM'),
('dest_2', 'tour_ooty_nilgiris', 'Nilgiri Tea Estate & Museum', 'Historic indoor tea manufacturing plant with panoramic tea garden walks and tasting salon.', 11.4230, 76.7320, 2, '01:30 PM', '03:30 PM'),
('dest_3', 'tour_ooty_nilgiris', 'Doddabetta Peak & Telescope House', 'Highest peak in Nilgiri Mountains at 2,637m offering sweeping Valley vistas.', 11.4010, 76.7350, 3, '03:45 PM', '05:30 PM'),
('dest_4', 'tour_ooty_nilgiris', 'Ooty Boat House & Lake', 'Lush lakeside hub with boating, cycling, and traditional handicraft cottages.', 11.4050, 76.6900, 4, '06:00 PM', '07:30 PM');

-- 5. Groups (Adaptive Clusters)
INSERT INTO `groups` (`id`, `tour_id`, `name`, `leader_name`, `leader_phone`, `color_hex`, `walking_preference`, `avg_age`, `common_interests`, `compatibility_score`, `status`) VALUES
('grp_alpha', 'tour_ooty_nilgiris', 'Alpha - Nature Trekkers', 'Rahul Kumar', '+91 98451 12345', '#10B981', 'Fast', 28, 'Photography, Trekking, Flora', 95, 'ACTIVE'),
('grp_beta', 'tour_ooty_nilgiris', 'Beta - Heritage & Culture', 'Deepa Nair', '+91 98451 45678', '#3B82F6', 'Moderate', 42, 'History, Architecture, Tea Tasting', 91, 'ACTIVE'),
('grp_gamma', 'tour_ooty_nilgiris', 'Gamma - Leisure & Wellness', 'Suresh Hegde', '+91 98451 67890', '#F59E0B', 'Slow', 58, 'Relaxation, Botanical Walks, Scenic Views', 88, 'ACTIVE');

-- 6. Tourists
INSERT INTO `tourists` (`id`, `user_id`, `tour_id`, `group_id`, `name`, `age`, `gender`, `preferred_language`, `walking_preference`, `activity_preference`, `interests`, `accessibility_requirements`, `emergency_contact_name`, `emergency_contact_phone`, `current_latitude`, `current_longitude`, `status`) VALUES
('trt_1', 'usr_tourist_1', 'tour_ooty_nilgiris', 'grp_alpha', 'Rahul Kumar', 28, 'Male', 'Hindi', 'Fast', 'Adventurous', 'Photography, Trekking, Wildlife', 'None', 'Sunita Kumar', '+91 98451 99991', 11.4192, 76.7115, 'ACTIVE'),
('trt_2', 'usr_tourist_2', 'tour_ooty_nilgiris', 'grp_alpha', 'Priya Sharma', 26, 'Female', 'English', 'Fast', 'Adventurous', 'Mountain biking, Landscapes, Camping', 'None', 'Mohit Sharma', '+91 98451 99992', 11.4194, 76.7118, 'ACTIVE'),
('trt_3', 'usr_tourist_3', 'tour_ooty_nilgiris', 'grp_alpha', 'Arun Swaminathan', 30, 'Male', 'Tamil', 'Fast', 'Nature', 'Bird watching, Botany, Trekking', 'None', 'Swaminathan R', '+91 98451 99993', 11.4188, 76.7110, 'ACTIVE'),
('trt_4', 'usr_tourist_4', 'tour_ooty_nilgiris', 'grp_beta', 'Deepa Nair', 41, 'Female', 'Malayalam', 'Moderate', 'Cultural', 'Colonial History, Museums, Local Cuisine', 'None', 'Radhakrishnan N', '+91 98451 99994', 11.4180, 76.7100, 'ACTIVE'),
('trt_5', 'usr_tourist_5', 'tour_ooty_nilgiris', 'grp_beta', 'Kavitha Reddy', 39, 'Female', 'Telugu', 'Moderate', 'Cultural', 'Handicrafts, Architecture, Heritage', 'None', 'Prabhakar Reddy', '+91 98451 99995', 11.4182, 76.7103, 'ACTIVE'),
('trt_6', 'usr_tourist_6', 'tour_ooty_nilgiris', 'grp_gamma', 'Suresh Hegde', 62, 'Male', 'Kannada', 'Slow', 'Relaxed', 'Botanical gardens, Meditation, Tea Tasting', 'Walking Cane', 'Raghav Hegde', '+91 98451 99996', 11.4175, 76.7092, 'ACTIVE'),
('trt_7', 'usr_tourist_7', 'tour_ooty_nilgiris', 'grp_alpha', 'Ananya Patel', 27, 'Female', 'English', 'Fast', 'Adventurous', 'Trekking, Rock climbing, Vlogging', 'None', 'Hitesh Patel', '+91 98451 99997', 11.4190, 76.7120, 'ACTIVE'),
('trt_8', 'usr_tourist_8', 'tour_ooty_nilgiris', 'grp_beta', 'Rohan Mehra', 44, 'Male', 'Hindi', 'Moderate', 'Cultural', 'Antiques, Colonial Architecture, Tea Blending', 'None', 'Shalini Mehra', '+91 98451 99998', 11.4184, 76.7105, 'ACTIVE'),
('trt_9', 'usr_tourist_9', 'tour_ooty_nilgiris', 'grp_gamma', 'Meera Subramanian', 59, 'Female', 'Tamil', 'Slow', 'Relaxed', 'Spiritual sites, Flower shows, Classical music', 'Needs ramp access', 'Kalyanaraman S', '+91 98451 99999', 11.4173, 76.7090, 'ACTIVE'),
('trt_10', 'usr_tourist_10', 'tour_ooty_nilgiris', 'grp_alpha', 'Karthik Raja', 29, 'Male', 'Tamil', 'Fast', 'Nature', 'Off-road exploration, Photography, Astronomy', 'None', 'Selvi Raja', '+91 98452 00001', 11.4195, 76.7116, 'ACTIVE'),
('trt_11', 'usr_tourist_11', 'tour_ooty_nilgiris', 'grp_beta', 'Neha Verma', 38, 'Female', 'Hindi', 'Moderate', 'Cultural', 'Local markets, Culinary workshops, Folk art', 'None', 'Vikas Verma', '+91 98452 00002', 11.4181, 76.7108, 'ACTIVE'),
('trt_12', 'usr_tourist_12', 'tour_ooty_nilgiris', 'grp_gamma', 'Girish Kulkarni', 65, 'Male', 'Kannada', 'Slow', 'Relaxed', 'Lake promenades, Bird listening, History books', 'Mild arthritis', 'Manjula K', '+91 98452 00003', 11.4174, 76.7088, 'ACTIVE'),
('trt_13', 'usr_tourist_13', 'tour_ooty_nilgiris', 'grp_beta', 'Sneha Menon', 36, 'Female', 'Malayalam', 'Moderate', 'Nature', 'Eco-farms, Spice gardens, Photography', 'None', 'Ajay Menon', '+91 98452 00004', 11.4186, 76.7102, 'ACTIVE'),
('trt_14', 'usr_tourist_14', 'tour_ooty_nilgiris', 'grp_gamma', 'Venkatesh Rao', 61, 'Male', 'Telugu', 'Slow', 'Relaxed', 'Herbal gardens, Souvenirs, Calm viewpoints', 'Mild asthma', 'Laxmi Rao', '+91 98452 00005', 11.4172, 76.7094, 'ACTIVE'),
('trt_15', 'usr_tourist_15', 'tour_ooty_nilgiris', 'grp_alpha', 'Divya Balaji', 25, 'Female', 'Tamil', 'Fast', 'Adventurous', 'Trail running, Wildlife safari, Drone filming', 'None', 'Balaji K', '+91 98452 00006', 11.4196, 76.7119, 'ACTIVE'),
('trt_16', 'usr_tourist_16', 'tour_ooty_nilgiris', 'grp_gamma', 'Amitabh Sen', 57, 'Male', 'English', 'Slow', 'Relaxed', 'Historical archives, Tea factory, Scenic drives', 'None', 'Rupa Sen', '+91 98452 00007', 11.4176, 76.7091, 'ACTIVE');

-- 7. Group Members Mapping
INSERT INTO `group_members` (`id`, `group_id`, `tourist_id`, `compatibility_score`) VALUES
('gm_1', 'grp_alpha', 'trt_1', 96),
('gm_2', 'grp_alpha', 'trt_2', 95),
('gm_3', 'grp_alpha', 'trt_3', 94),
('gm_4', 'grp_alpha', 'trt_7', 97),
('gm_5', 'grp_alpha', 'trt_10', 93),
('gm_6', 'grp_alpha', 'trt_15', 96),
('gm_7', 'grp_beta', 'trt_4', 92),
('gm_8', 'grp_beta', 'trt_5', 90),
('gm_9', 'grp_beta', 'trt_8', 91),
('gm_10', 'grp_beta', 'trt_11', 89),
('gm_11', 'grp_beta', 'trt_13', 93),
('gm_12', 'grp_gamma', 'trt_6', 88),
('gm_13', 'grp_gamma', 'trt_9', 90),
('gm_14', 'grp_gamma', 'trt_12', 87),
('gm_15', 'grp_gamma', 'trt_14', 86),
('gm_16', 'grp_gamma', 'trt_16', 89);

-- 8. Tourist Preferences
INSERT INTO `tourist_preferences` (`id`, `tourist_id`, `pace_level`, `dietary_pref`, `physical_ability`, `budget_tier`, `special_notes`) VALUES
('pref_1', 'trt_1', 5, 'Non-Vegetarian', 'High', 'Comfort', 'Enthusiastic photographer, carries DSLR tripod.'),
('pref_2', 'trt_2', 5, 'Vegetarian', 'High', 'Comfort', 'Interested in intense hikes and summits.'),
('pref_3', 'trt_3', 4, 'Vegetarian', 'High', 'Standard', 'Fluent in Tamil and English, knows local flora.'),
('pref_4', 'trt_4', 3, 'Non-Vegetarian', 'Medium', 'Comfort', 'Loves museum audio guides and artisan stories.'),
('pref_5', 'trt_5', 3, 'Vegetarian', 'Medium', 'Standard', 'Enjoys cultural craft workshops.'),
('pref_6', 'trt_6', 1, 'Strict Vegetarian', 'Low', 'Comfort', 'Requires benches at intervals, gentle walking.'),
('pref_7', 'trt_7', 5, 'Vegan', 'High', 'Luxury', 'Travel blogger with active drone permit.'),
('pref_8', 'trt_8', 3, 'Non-Vegetarian', 'Medium', 'Luxury', 'Collects heritage tea blends.'),
('pref_9', 'trt_9', 1, 'Vegetarian', 'Low', 'Standard', 'Requires wheelchair accessible ramps.'),
('pref_10', 'trt_10', 4, 'Non-Vegetarian', 'High', 'Standard', 'Adventure sports enthusiast.'),
('pref_11', 'trt_11', 3, 'Vegetarian', 'Medium', 'Comfort', 'Interested in Nilgiri chocolate making.'),
('pref_12', 'trt_12', 1, 'Vegetarian', 'Low', 'Standard', 'Prefers scenic bus viewpoints over steep climbs.'),
('pref_13', 'trt_13', 3, 'Non-Vegetarian', 'Medium', 'Comfort', 'Ecologist and nature sketch artist.'),
('pref_14', 'trt_14', 1, 'Vegetarian', 'Low', 'Standard', 'Carries inhaler, prefers clean indoor airs.'),
('pref_15', 'trt_15', 5, 'Vegetarian', 'High', 'Standard', 'Fast hiker, first aid certified.'),
('pref_16', 'trt_16', 2, 'Non-Vegetarian', 'Medium', 'Luxury', 'British colonial architecture buff.');

-- 9. Activities (Primary + Fallbacks)
INSERT INTO `activities` (`id`, `tour_id`, `destination_id`, `title`, `description`, `activity_type`, `duration_minutes`, `cost`, `is_weather_sensitive`, `fallback_activity_id`, `latitude`, `longitude`, `status`) VALUES
('act_1', 'tour_ooty_nilgiris', 'dest_1', 'Botanical Garden Heritage Walk', 'Guided morning exploration of 175-year-old exotic trees, ferns and Italian floral terrace.', 'sightseeing', 90, 150.00, TRUE, 'act_fb_1', 11.4190, 76.7112, 'SCHEDULED'),
('act_2', 'tour_ooty_nilgiris', 'dest_2', 'Factory Floor Tea Processing & Tasting', 'Step-by-step leaf-to-cup tea production viewing, CTC factory machinery, and specialty Nilgiri black tea degustation.', 'indoor', 75, 250.00, FALSE, NULL, 11.4230, 76.7320, 'SCHEDULED'),
('act_3', 'tour_ooty_nilgiris', 'dest_3', 'Doddabetta Summit & Shola Ridge Walk', 'Panoramic vista point trek along Shola ridge with telescope house viewing.', 'outdoor', 105, 100.00, TRUE, 'act_fb_2', 11.4010, 76.7350, 'SCHEDULED'),
('act_4', 'tour_ooty_nilgiris', 'dest_4', 'Ooty Lake Rowboating & Sunset Promenade', 'Lakeside boating and sunset walk along eucalyptus groves.', 'outdoor', 60, 200.00, TRUE, 'act_fb_3', 11.4050, 76.6900, 'SCHEDULED'),
-- Indoor Weather Fallbacks
('act_fb_1', 'tour_ooty_nilgiris', 'dest_1', 'Government Museum & Art Conservatory (Indoor)', 'Covered cultural museum displaying Toda tribal artifacts, stone sculptures and botanical paintings.', 'indoor', 90, 100.00, FALSE, NULL, 11.4150, 76.7050, 'SCHEDULED'),
('act_fb_2', 'tour_ooty_nilgiris', 'dest_2', 'Tea Museum Multimedia Cinema & Indoor Blending', 'Indoor documentary screening on Nilgiri tea history followed by custom tea blending workshop.', 'indoor', 90, 200.00, FALSE, NULL, 11.4235, 76.7325, 'SCHEDULED'),
('act_fb_3', 'tour_ooty_nilgiris', 'dest_4', 'Nilgiri Chocolate Masterclass & Artisan Lounge', 'Indoor homemade chocolate tasting, tempering demo, and coffee lounge experience.', 'indoor', 60, 250.00, FALSE, NULL, 11.4070, 76.6920, 'SCHEDULED');

-- 10. Itineraries
INSERT INTO `itineraries` (`id`, `tour_id`, `group_id`, `day_number`, `date`, `title`, `status`) VALUES
('itin_day1_main', 'tour_ooty_nilgiris', NULL, 1, '2026-09-01', 'Day 1: Flora, Mountain Mist & Nilgiri Aromas', 'ACTIVE'),
('itin_day2_main', 'tour_ooty_nilgiris', NULL, 2, '2026-09-02', 'Day 2: Heritage Toy Train & Coonoor Waterfalls', 'ACTIVE');

-- 11. Itinerary Items
INSERT INTO `itinerary_items` (`id`, `itinerary_id`, `activity_id`, `start_time`, `end_time`, `title`, `description`, `location_name`, `latitude`, `longitude`, `is_alternative`, `order_index`, `status`, `weather_alert`) VALUES
('ii_1', 'itin_day1_main', NULL, '08:00', '09:00', 'Welcome Breakfast & Group Briefing', 'Fresh South Indian buffet and day itinerary introduction with multilingual voice assistant setup.', 'Hotel Savoy Ooty', 11.4080, 76.7000, FALSE, 1, 'COMPLETED', NULL),
('ii_2', 'itin_day1_main', 'act_1', '09:30', '11:45', 'Botanical Garden Heritage Walk', 'Guided botanical walk through Italian Garden and Toda Arboretum.', 'Ooty Botanical Gardens', 11.4190, 76.7112, FALSE, 2, 'IN_PROGRESS', NULL),
('ii_3', 'itin_day1_main', NULL, '12:15', '01:30', 'Nilgiri Traditional Thali Lunch', 'Authentic regional feast at Shinkows Heritage Hall.', 'Commercial Road', 11.4110, 76.7030, FALSE, 3, 'SCHEDULED', NULL),
('ii_4', 'itin_day1_main', 'act_2', '01:45', '03:15', 'Nilgiri Tea Estate & Museum Tour', 'Factory floor machinery tour, tea leaf picking and tasting.', 'Dodabetta Tea Estate', 11.4230, 76.7320, FALSE, 4, 'SCHEDULED', NULL),
('ii_5', 'itin_day1_main', 'act_3', '03:45', '05:30', 'Doddabetta Peak & Telescope Observation', 'Sweeping vistas of the Western Ghats and pine ridge trail.', 'Doddabetta Summit', 11.4010, 76.7350, FALSE, 5, 'SCHEDULED', 'Rain alert: Rain probability 75% between 14:00 - 17:00'),
('ii_6', 'itin_day1_main', 'act_4', '06:00', '07:30', 'Ooty Boathouse & Lake Promenade', 'Rowboat ride and evening handicraft bazaar.', 'Ooty Lake', 11.4050, 76.6900, FALSE, 6, 'SCHEDULED', NULL);

-- 12. Emergencies (Sample Resolved Emergency)
INSERT INTO `emergencies` (`id`, `tourist_id`, `tour_id`, `group_id`, `latitude`, `longitude`, `emergency_type`, `message`, `status`, `priority`, `assigned_responder`, `resolution_notes`, `reported_at`, `resolved_at`) VALUES
('emg_sample_1', 'trt_6', 'tour_ooty_nilgiris', 'grp_gamma', 11.4175, 76.7092, 'MOBILITY_ASSIST', 'Mild dizziness due to high altitude at botanical garden upper terrace.', 'RESOLVED', 'HIGH', 'First Responder Murugan', 'Administered hydration and glucose. Transported back to hotel lounge in electric golf cart. Tourist fully stable.', '2026-08-27 10:15:00', '2026-08-27 10:45:00');

INSERT INTO `emergency_expenses` (`id`, `emergency_id`, `transport_type`, `estimated_distance_km`, `estimated_cost_min`, `estimated_cost_max`, `actual_cost`, `reserve_available`, `notes`) VALUES
('ee_1', 'emg_sample_1', 'Electric Golf Cart / Local Transit', 3.5, 450.00, 800.00, 500.00, 24500.00, 'Local garden support vehicle and emergency medical kit utilized.');

-- 13. Pre-booking Tour Costs
INSERT INTO `tour_costs` (`id`, `tour_id`, `tourist_count`, `transportation_cost`, `accommodation_cost`, `food_cost`, `activity_cost`, `guide_cost`, `misc_cost`, `contingency_cost`, `total_cost`, `per_person_cost`) VALUES
('tc_1', 'tour_ooty_nilgiris', 16, 42000.00, 68000.00, 36000.00, 18400.00, 12000.00, 4600.00, 10000.00, 191000.00, 11937.50);

-- 14. AI Recommendations (Initial Pre-configured Weather Insight)
INSERT INTO `ai_recommendations` (`id`, `tour_id`, `agent_source`, `recommendation_text`, `reason`, `confidence_score`, `affected_groups`, `affected_activities`, `suggested_alternative`, `status`) VALUES
('rec_init_1', 'tour_ooty_nilgiris', 'Coordinator Agent (Gemini + Weather + Route)', 'Heavy afternoon rain shower (75% probability, 14mm/h) predicted near Doddabetta Peak between 2:00 PM and 4:30 PM. Postpone the outdoor summit walk and reroute Group Alpha & Beta to the Indoor Tea Museum Multimedia Cinema and Artisan Chocolate Masterclass.', 'Weather Agent detected rapid cloud condensation over Doddabetta Ridge. Route Agent confirmed Doddabetta Ghat road is slippery. Itinerary Agent verified indoor capacity at Tea Museum is open with zero wait time.', 0.94, 'Alpha - Nature Trekkers, Beta - Heritage & Culture', 'Doddabetta Peak Walk (Outdoor)', 'Tea Museum Multimedia Cinema & Artisan Chocolate Tasting (Indoor)', 'PENDING');

-- 15. Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`) VALUES
('nt_1', 'usr_operator_1', 'AI Weather Warning', 'Rain shower expected at Doddabetta Peak at 2:00 PM. AI recommendation generated.', 'AI', FALSE),
('nt_2', 'usr_operator_1', 'All Tourists Checked In', '16 tourists currently transmitting active GPS telemetry in Ooty Botanical Gardens.', 'INFO', TRUE);
