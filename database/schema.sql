-- =========================================================
-- Intelligent Tourism Management Platform - MySQL Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS `intelligent_tourism_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `intelligent_tourism_db`;

-- Drop existing tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `route_records`;
DROP TABLE IF EXISTS `weather_records`;
DROP TABLE IF EXISTS `ai_recommendations`;
DROP TABLE IF EXISTS `tour_costs`;
DROP TABLE IF EXISTS `tour_expenses`;
DROP TABLE IF EXISTS `emergency_expenses`;
DROP TABLE IF EXISTS `emergencies`;
DROP TABLE IF EXISTS `tourist_locations`;
DROP TABLE IF EXISTS `itinerary_items`;
DROP TABLE IF EXISTS `itineraries`;
DROP TABLE IF EXISTS `tourist_preferences`;
DROP TABLE IF EXISTS `group_members`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `destinations`;
DROP TABLE IF EXISTS `tourists`;
DROP TABLE IF EXISTS `operators`;
DROP TABLE IF EXISTS `tours`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users
CREATE TABLE `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('operator', 'tourist') NOT NULL DEFAULT 'tourist',
    `phone` VARCHAR(30),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB;

-- 2. Operators
CREATE TABLE `operators` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL UNIQUE,
    `company_name` VARCHAR(150) NOT NULL,
    `license_number` VARCHAR(100),
    `emergency_hotline` VARCHAR(30),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_operator_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Tours
CREATE TABLE `tours` (
    `id` VARCHAR(64) PRIMARY KEY,
    `operator_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `budget` DECIMAL(12,2) DEFAULT 0.00,
    `max_capacity` INT DEFAULT 30,
    `status` ENUM('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    `primary_destination` VARCHAR(150) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tours_status` (`status`),
    INDEX `idx_tours_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB;

-- 4. Destinations
CREATE TABLE `destinations` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `latitude` DECIMAL(10,7) NOT NULL,
    `longitude` DECIMAL(10,7) NOT NULL,
    `order_index` INT NOT NULL DEFAULT 1,
    `arrival_time` VARCHAR(30),
    `departure_time` VARCHAR(30),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_dest_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    INDEX `idx_dest_tour` (`tour_id`, `order_index`)
) ENGINE=InnoDB;

-- 5. Groups
CREATE TABLE `groups` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `leader_name` VARCHAR(100),
    `leader_phone` VARCHAR(30),
    `color_hex` VARCHAR(20) DEFAULT '#3B82F6',
    `walking_preference` VARCHAR(50) DEFAULT 'Moderate',
    `avg_age` INT DEFAULT 30,
    `common_interests` VARCHAR(255) DEFAULT 'Sightseeing',
    `compatibility_score` INT DEFAULT 90,
    `status` ENUM('ACTIVE', 'MERGED', 'SPLIT', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_group_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    INDEX `idx_group_tour` (`tour_id`, `status`)
) ENGINE=InnoDB;

-- 6. Tourists
CREATE TABLE `tourists` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) UNIQUE,
    `tour_id` VARCHAR(64),
    `group_id` VARCHAR(64),
    `name` VARCHAR(120) NOT NULL,
    `age` INT NOT NULL DEFAULT 28,
    `gender` VARCHAR(20) DEFAULT 'Other',
    `preferred_language` VARCHAR(50) NOT NULL DEFAULT 'English',
    `walking_preference` ENUM('Slow', 'Moderate', 'Fast', 'Minimal') DEFAULT 'Moderate',
    `activity_preference` ENUM('Relaxed', 'Moderate', 'Adventurous', 'Cultural', 'Nature') DEFAULT 'Cultural',
    `interests` TEXT,
    `accessibility_requirements` VARCHAR(255) DEFAULT 'None',
    `emergency_contact_name` VARCHAR(100),
    `emergency_contact_phone` VARCHAR(30),
    `current_latitude` DECIMAL(10,7) DEFAULT 11.4102,
    `current_longitude` DECIMAL(10,7) DEFAULT 76.6950,
    `last_location_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('ACTIVE', 'OFFLINE', 'EMERGENCY', 'CHECKED_OUT') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tourist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_tourist_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_tourist_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL,
    INDEX `idx_tourist_tour_group` (`tour_id`, `group_id`),
    INDEX `idx_tourist_status` (`status`)
) ENGINE=InnoDB;

-- 7. Group Members
CREATE TABLE `group_members` (
    `id` VARCHAR(64) PRIMARY KEY,
    `group_id` VARCHAR(64) NOT NULL,
    `tourist_id` VARCHAR(64) NOT NULL,
    `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `compatibility_score` INT DEFAULT 88,
    CONSTRAINT `fk_gm_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gm_tourist` FOREIGN KEY (`tourist_id`) REFERENCES `tourists` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_group_tourist` (`group_id`, `tourist_id`)
) ENGINE=InnoDB;

-- 8. Tourist Preferences
CREATE TABLE `tourist_preferences` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tourist_id` VARCHAR(64) NOT NULL UNIQUE,
    `pace_level` INT DEFAULT 3,
    `dietary_pref` VARCHAR(100) DEFAULT 'Vegetarian',
    `physical_ability` VARCHAR(100) DEFAULT 'Good',
    `budget_tier` ENUM('Standard', 'Comfort', 'Luxury') DEFAULT 'Standard',
    `special_notes` TEXT,
    CONSTRAINT `fk_pref_tourist` FOREIGN KEY (`tourist_id`) REFERENCES `tourists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Activities
CREATE TABLE `activities` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `destination_id` VARCHAR(64),
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT,
    `activity_type` ENUM('outdoor', 'indoor', 'sightseeing', 'dining', 'adventure', 'transport') NOT NULL DEFAULT 'sightseeing',
    `duration_minutes` INT DEFAULT 60,
    `cost` DECIMAL(10,2) DEFAULT 0.00,
    `is_weather_sensitive` BOOLEAN DEFAULT TRUE,
    `fallback_activity_id` VARCHAR(64),
    `latitude` DECIMAL(10,7),
    `longitude` DECIMAL(10,7),
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED', 'REPLACED') DEFAULT 'SCHEDULED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_act_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_act_dest` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Itineraries
CREATE TABLE `itineraries` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `group_id` VARCHAR(64),
    `day_number` INT NOT NULL DEFAULT 1,
    `date` DATE NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `status` ENUM('ACTIVE', 'ADAPTED', 'COMPLETED') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_itin_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_itin_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Itinerary Items
CREATE TABLE `itinerary_items` (
    `id` VARCHAR(64) PRIMARY KEY,
    `itinerary_id` VARCHAR(64) NOT NULL,
    `activity_id` VARCHAR(64),
    `start_time` VARCHAR(10) NOT NULL,
    `end_time` VARCHAR(10) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT,
    `location_name` VARCHAR(150),
    `latitude` DECIMAL(10,7),
    `longitude` DECIMAL(10,7),
    `is_alternative` BOOLEAN DEFAULT FALSE,
    `order_index` INT DEFAULT 1,
    `status` ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'DISRUPTED', 'REPLACED') DEFAULT 'SCHEDULED',
    `weather_alert` VARCHAR(255),
    CONSTRAINT `fk_item_itin` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_act` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL,
    INDEX `idx_itin_order` (`itinerary_id`, `order_index`)
) ENGINE=InnoDB;

-- 12. Tourist Locations (Historical Breadcrumbs)
CREATE TABLE `tourist_locations` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tourist_id` VARCHAR(64) NOT NULL,
    `latitude` DECIMAL(10,7) NOT NULL,
    `longitude` DECIMAL(10,7) NOT NULL,
    `accuracy` DECIMAL(8,2) DEFAULT 5.0,
    `speed` DECIMAL(8,2) DEFAULT 0.0,
    `heading` DECIMAL(8,2) DEFAULT 0.0,
    `battery_level` INT DEFAULT 85,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_loc_tourist` FOREIGN KEY (`tourist_id`) REFERENCES `tourists` (`id`) ON DELETE CASCADE,
    INDEX `idx_loc_tourist_time` (`tourist_id`, `timestamp` DESC)
) ENGINE=InnoDB;

-- 13. Emergencies (SOS)
CREATE TABLE `emergencies` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tourist_id` VARCHAR(64) NOT NULL,
    `tour_id` VARCHAR(64) NOT NULL,
    `group_id` VARCHAR(64),
    `latitude` DECIMAL(10,7) NOT NULL,
    `longitude` DECIMAL(10,7) NOT NULL,
    `emergency_type` VARCHAR(100) DEFAULT 'MEDICAL',
    `message` TEXT,
    `status` ENUM('ACTIVE', 'INVESTIGATING', 'RESOLVED') DEFAULT 'ACTIVE',
    `priority` ENUM('NORMAL', 'HIGH', 'CRITICAL') DEFAULT 'CRITICAL',
    `assigned_responder` VARCHAR(120),
    `resolution_notes` TEXT,
    `reported_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME,
    CONSTRAINT `fk_emg_tourist` FOREIGN KEY (`tourist_id`) REFERENCES `tourists` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_emg_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    INDEX `idx_emg_status_priority` (`status`, `priority`)
) ENGINE=InnoDB;

-- 14. Emergency Expenses
CREATE TABLE `emergency_expenses` (
    `id` VARCHAR(64) PRIMARY KEY,
    `emergency_id` VARCHAR(64) NOT NULL,
    `transport_type` VARCHAR(80) DEFAULT 'Emergency Vehicle',
    `estimated_distance_km` DECIMAL(8,2) DEFAULT 15.0,
    `estimated_cost_min` DECIMAL(10,2) DEFAULT 1500.00,
    `estimated_cost_max` DECIMAL(10,2) DEFAULT 3000.00,
    `actual_cost` DECIMAL(10,2),
    `reserve_available` DECIMAL(12,2) DEFAULT 25000.00,
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_emg_exp` FOREIGN KEY (`emergency_id`) REFERENCES `emergencies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Tour Expenses
CREATE TABLE `tour_expenses` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `category` ENUM('transport', 'accommodation', 'food', 'activities', 'guide', 'emergency', 'misc') NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `date` DATE NOT NULL,
    `receipt_ref` VARCHAR(100),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_texp_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    INDEX `idx_texp_category` (`tour_id`, `category`)
) ENGINE=InnoDB;

-- 16. Tour Costs (Pre-Booking Estimates)
CREATE TABLE `tour_costs` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64),
    `tourist_count` INT NOT NULL DEFAULT 20,
    `transportation_cost` DECIMAL(12,2) DEFAULT 0.00,
    `accommodation_cost` DECIMAL(12,2) DEFAULT 0.00,
    `food_cost` DECIMAL(12,2) DEFAULT 0.00,
    `activity_cost` DECIMAL(12,2) DEFAULT 0.00,
    `guide_cost` DECIMAL(12,2) DEFAULT 0.00,
    `misc_cost` DECIMAL(12,2) DEFAULT 0.00,
    `contingency_cost` DECIMAL(12,2) DEFAULT 0.00,
    `total_cost` DECIMAL(12,2) NOT NULL,
    `per_person_cost` DECIMAL(12,2) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 17. AI Recommendations
CREATE TABLE `ai_recommendations` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64) NOT NULL,
    `agent_source` VARCHAR(50) DEFAULT 'Coordinator Agent',
    `recommendation_text` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `confidence_score` DECIMAL(4,2) DEFAULT 0.92,
    `affected_groups` VARCHAR(255),
    `affected_activities` VARCHAR(255),
    `suggested_alternative` TEXT,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ai_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
    INDEX `idx_ai_status` (`status`)
) ENGINE=InnoDB;

-- 18. Weather Records
CREATE TABLE `weather_records` (
    `id` VARCHAR(64) PRIMARY KEY,
    `destination_id` VARCHAR(64),
    `latitude` DECIMAL(10,7) NOT NULL,
    `longitude` DECIMAL(10,7) NOT NULL,
    `temperature` DECIMAL(5,2),
    `rain_probability` INT DEFAULT 0,
    `weather_code` INT DEFAULT 0,
    `wind_speed` DECIMAL(5,2),
    `condition_text` VARCHAR(100),
    `is_disruptive` BOOLEAN DEFAULT FALSE,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_weather_disruptive` (`is_disruptive`, `timestamp` DESC)
) ENGINE=InnoDB;

-- 19. Route Records
CREATE TABLE `route_records` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tour_id` VARCHAR(64),
    `origin_lat` DECIMAL(10,7) NOT NULL,
    `origin_lng` DECIMAL(10,7) NOT NULL,
    `dest_lat` DECIMAL(10,7) NOT NULL,
    `dest_lng` DECIMAL(10,7) NOT NULL,
    `distance_km` DECIMAL(8,2),
    `duration_mins` INT,
    `road_condition` VARCHAR(100) DEFAULT 'Normal',
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `checked_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 20. Notifications
CREATE TABLE `notifications` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64),
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'EMERGENCY', 'AI') DEFAULT 'INFO',
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notif_user` (`user_id`, `is_read`, `created_at` DESC)
) ENGINE=InnoDB;
