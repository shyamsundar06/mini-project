const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
require('dotenv').config();

let dbType = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;
let isInitialized = false;

// If on Vercel serverless, store SQLite in /tmp
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const sqliteFilePath = isVercel 
    ? path.join('/tmp', 'intelligent_tourism.sqlite')
    : path.join(__dirname, '../../database/intelligent_tourism.sqlite');

function initSqlite() {
    return new Promise((resolve, reject) => {
        sqliteDb = new sqlite3.Database(sqliteFilePath, (err) => {
            if (err) {
                console.error('[DB] SQLite connection failed:', err);
                return reject(err);
            }
            console.log('[DB] Connected to SQLite database:', sqliteFilePath);
            setupSqliteTables()
                .then(() => {
                    isInitialized = true;
                    resolve();
                })
                .catch(reject);
        });
    });
}

function runSqlite(sql, params = []) {
    return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ insertId: this.lastID, changes: this.changes });
        });
    });
}

function allSqlite(sql, params = []) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function setupSqliteTables() {
    // Check if tables already exist
    const rows = await allSqlite("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (rows && rows.length > 0) {
        console.log('[DB] SQLite tables already initialized.');
        return;
    }

    console.log('[DB] Initializing SQLite tables and seed data...');
    const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'tourist',
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operators (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        company_name TEXT NOT NULL,
        license_number TEXT,
        emergency_hotline TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tours (
        id TEXT PRIMARY KEY,
        operator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        budget REAL DEFAULT 0.0,
        max_capacity INTEGER DEFAULT 30,
        status TEXT DEFAULT 'ACTIVE',
        primary_destination TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS destinations (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        order_index INTEGER DEFAULT 1,
        arrival_time TEXT,
        departure_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        name TEXT NOT NULL,
        leader_name TEXT,
        leader_phone TEXT,
        color_hex TEXT DEFAULT '#3B82F6',
        walking_preference TEXT DEFAULT 'Moderate',
        avg_age INTEGER DEFAULT 30,
        common_interests TEXT DEFAULT 'Sightseeing',
        compatibility_score INTEGER DEFAULT 90,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tourists (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        tour_id TEXT,
        group_id TEXT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL DEFAULT 28,
        gender TEXT DEFAULT 'Other',
        preferred_language TEXT NOT NULL DEFAULT 'English',
        walking_preference TEXT DEFAULT 'Moderate',
        activity_preference TEXT DEFAULT 'Cultural',
        interests TEXT,
        accessibility_requirements TEXT DEFAULT 'None',
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        current_latitude REAL DEFAULT 11.4190,
        current_longitude REAL DEFAULT 76.7112,
        last_location_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        tourist_id TEXT NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        compatibility_score INTEGER DEFAULT 88,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
        FOREIGN KEY (tourist_id) REFERENCES tourists (id) ON DELETE CASCADE,
        UNIQUE (group_id, tourist_id)
    );

    CREATE TABLE IF NOT EXISTS tourist_preferences (
        id TEXT PRIMARY KEY,
        tourist_id TEXT NOT NULL UNIQUE,
        pace_level INTEGER DEFAULT 3,
        dietary_pref TEXT DEFAULT 'Vegetarian',
        physical_ability TEXT DEFAULT 'Good',
        budget_tier TEXT DEFAULT 'Standard',
        special_notes TEXT,
        FOREIGN KEY (tourist_id) REFERENCES tourists (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        destination_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        activity_type TEXT DEFAULT 'sightseeing',
        duration_minutes INTEGER DEFAULT 60,
        cost REAL DEFAULT 0.0,
        is_weather_sensitive INTEGER DEFAULT 1,
        fallback_activity_id TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'SCHEDULED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE,
        FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS itineraries (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        group_id TEXT,
        day_number INTEGER DEFAULT 1,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS itinerary_items (
        id TEXT PRIMARY KEY,
        itinerary_id TEXT NOT NULL,
        activity_id TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location_name TEXT,
        latitude REAL,
        longitude REAL,
        is_alternative INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 1,
        status TEXT DEFAULT 'SCHEDULED',
        weather_alert TEXT,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries (id) ON DELETE CASCADE,
        FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tourist_locations (
        id TEXT PRIMARY KEY,
        tourist_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL DEFAULT 5.0,
        speed REAL DEFAULT 0.0,
        heading REAL DEFAULT 0.0,
        battery_level INTEGER DEFAULT 85,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tourist_id) REFERENCES tourists (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emergencies (
        id TEXT PRIMARY KEY,
        tourist_id TEXT NOT NULL,
        tour_id TEXT NOT NULL,
        group_id TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        emergency_type TEXT DEFAULT 'MEDICAL',
        message TEXT,
        status TEXT DEFAULT 'ACTIVE',
        priority TEXT DEFAULT 'CRITICAL',
        assigned_responder TEXT,
        resolution_notes TEXT,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (tourist_id) REFERENCES tourists (id) ON DELETE CASCADE,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emergency_expenses (
        id TEXT PRIMARY KEY,
        emergency_id TEXT NOT NULL,
        transport_type TEXT DEFAULT 'Emergency Vehicle',
        estimated_distance_km REAL DEFAULT 15.0,
        estimated_cost_min REAL DEFAULT 1500.0,
        estimated_cost_max REAL DEFAULT 3000.0,
        actual_cost REAL,
        reserve_available REAL DEFAULT 25000.0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (emergency_id) REFERENCES emergencies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tour_expenses (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        receipt_ref TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tour_costs (
        id TEXT PRIMARY KEY,
        tour_id TEXT,
        tourist_count INTEGER DEFAULT 20,
        transportation_cost REAL DEFAULT 0.0,
        accommodation_cost REAL DEFAULT 0.0,
        food_cost REAL DEFAULT 0.0,
        activity_cost REAL DEFAULT 0.0,
        guide_cost REAL DEFAULT 0.0,
        misc_cost REAL DEFAULT 0.0,
        contingency_cost REAL DEFAULT 0.0,
        total_cost REAL NOT NULL,
        per_person_cost REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_recommendations (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        agent_source TEXT DEFAULT 'Coordinator Agent',
        recommendation_text TEXT NOT NULL,
        reason TEXT NOT NULL,
        confidence_score REAL DEFAULT 0.92,
        affected_groups TEXT,
        affected_activities TEXT,
        suggested_alternative TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weather_records (
        id TEXT PRIMARY KEY,
        destination_id TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        temperature REAL,
        rain_probability INTEGER DEFAULT 0,
        weather_code INTEGER DEFAULT 0,
        wind_speed REAL,
        condition_text TEXT,
        is_disruptive INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_records (
        id TEXT PRIMARY KEY,
        tour_id TEXT,
        origin_lat REAL NOT NULL,
        origin_lng REAL NOT NULL,
        dest_lat REAL NOT NULL,
        dest_lng REAL NOT NULL,
        distance_km REAL,
        duration_mins INTEGER,
        road_condition TEXT DEFAULT 'Normal',
        is_blocked INTEGER DEFAULT 0,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'INFO',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `;

    const statements = schemaSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
        await runSqlite(stmt);
    }

    await populateSeedData();
}

async function populateSeedData() {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
        ['usr_operator_1', 'Vikram Anand', 'operator@tourism.com', passwordHash, 'operator', '+91 98765 43210'],
        ['usr_tourist_1', 'Rahul Kumar', 'rahul.kumar@gmail.com', passwordHash, 'tourist', '+91 98451 12345'],
        ['usr_tourist_2', 'Priya Sharma', 'priya.sharma@gmail.com', passwordHash, 'tourist', '+91 98451 23456'],
        ['usr_tourist_3', 'Arun Swaminathan', 'arun.swami@gmail.com', passwordHash, 'tourist', '+91 98451 34567'],
        ['usr_tourist_4', 'Deepa Nair', 'deepa.nair@gmail.com', passwordHash, 'tourist', '+91 98451 45678'],
        ['usr_tourist_5', 'Kavitha Reddy', 'kavitha.reddy@gmail.com', passwordHash, 'tourist', '+91 98451 56789'],
        ['usr_tourist_6', 'Suresh Hegde', 'suresh.hegde@gmail.com', passwordHash, 'tourist', '+91 98451 67890'],
        ['usr_tourist_7', 'Ananya Patel', 'ananya.p@gmail.com', passwordHash, 'tourist', '+91 98451 78901'],
        ['usr_tourist_8', 'Rohan Mehra', 'rohan.m@gmail.com', passwordHash, 'tourist', '+91 98451 89012'],
        ['usr_tourist_9', 'Meera Subramanian', 'meera.sub@gmail.com', passwordHash, 'tourist', '+91 98451 90123'],
        ['usr_tourist_10', 'Karthik Raja', 'karthik.r@gmail.com', passwordHash, 'tourist', '+91 98451 01234'],
        ['usr_tourist_11', 'Neha Verma', 'neha.v@gmail.com', passwordHash, 'tourist', '+91 98452 11223'],
        ['usr_tourist_12', 'Girish Kulkarni', 'girish.k@gmail.com', passwordHash, 'tourist', '+91 98452 22334'],
        ['usr_tourist_13', 'Sneha Menon', 'sneha.m@gmail.com', passwordHash, 'tourist', '+91 98452 33445'],
        ['usr_tourist_14', 'Venkatesh Rao', 'venky.rao@gmail.com', passwordHash, 'tourist', '+91 98452 44556'],
        ['usr_tourist_15', 'Divya Balaji', 'divya.b@gmail.com', passwordHash, 'tourist', '+91 98452 55667'],
        ['usr_tourist_16', 'Amitabh Sen', 'amitabh.s@gmail.com', passwordHash, 'tourist', '+91 98452 66778'],
        ['usr_sonika', 'Sonika', 'sonika@tourism.com', await bcrypt.hash('1234', 10), 'tourist', '+91 98451 11111'],
        ['usr_subika', 'Subika', 'subika@tourism.com', await bcrypt.hash('1234', 10), 'tourist', '+91 98451 22222']
    ];
    for (const u of users) {
        await runSqlite('INSERT OR IGNORE INTO users (id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)', u);
    }

    await runSqlite('INSERT OR IGNORE INTO operators (id, user_id, company_name, license_number, emergency_hotline) VALUES (?, ?, ?, ?, ?)',
        ['op_1', 'usr_operator_1', 'Nilgiri Heritage Eco Tours Pvt Ltd', 'TN-TO-2024-8849', '+91 800 112 3344']);

    await runSqlite('INSERT OR IGNORE INTO tours (id, operator_id, title, description, start_date, end_date, budget, max_capacity, status, primary_destination) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['tour_ooty_nilgiris', 'op_1', 'Nilgiris Grand Heritage & Botanical Discovery', 'An immersive 4-day premium exploration of Ooty, Doddabetta Peak, Tea Factory & Heritage Toy Train with dynamic AI itinerary adaptations.', '2026-09-01', '2026-09-04', 185000.00, 25, 'ACTIVE', 'Ooty & Nilgiri Hills, Tamil Nadu']);

    const dests = [
        ['dest_1', 'tour_ooty_nilgiris', 'Ooty Botanical Gardens', '55-acre terraced garden established in 1848 with rare tree fossils & exotic flora.', 11.4190, 76.7112, 1, '09:30 AM', '12:00 PM'],
        ['dest_2', 'tour_ooty_nilgiris', 'Nilgiri Tea Estate & Museum', 'Historic indoor tea manufacturing plant with panoramic tea garden walks and tasting salon.', 11.4230, 76.7320, 2, '01:30 PM', '03:30 PM'],
        ['dest_3', 'tour_ooty_nilgiris', 'Doddabetta Peak & Telescope House', 'Highest peak in Nilgiri Mountains at 2,637m offering sweeping Valley vistas.', 11.4010, 76.7350, 3, '03:45 PM', '05:30 PM'],
        ['dest_4', 'tour_ooty_nilgiris', 'Ooty Boat House & Lake', 'Lush lakeside hub with boating, cycling, and traditional handicraft cottages.', 11.4050, 76.6900, 4, '06:00 PM', '07:30 PM']
    ];
    for (const d of dests) {
        await runSqlite('INSERT OR IGNORE INTO destinations (id, tour_id, name, description, latitude, longitude, order_index, arrival_time, departure_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', d);
    }

    const grps = [
        ['grp_alpha', 'tour_ooty_nilgiris', 'Alpha - Nature Trekkers', 'Rahul Kumar', '+91 98451 12345', '#10B981', 'Fast', 28, 'Photography, Trekking, Flora', 95, 'ACTIVE'],
        ['grp_beta', 'tour_ooty_nilgiris', 'Beta - Heritage & Culture', 'Deepa Nair', '+91 98451 45678', '#3B82F6', 'Moderate', 42, 'History, Architecture, Tea Tasting', 91, 'ACTIVE'],
        ['grp_gamma', 'tour_ooty_nilgiris', 'Gamma - Leisure & Wellness', 'Suresh Hegde', '+91 98451 67890', '#F59E0B', 'Slow', 58, 'Relaxation, Botanical Walks, Scenic Views', 88, 'ACTIVE']
    ];
    for (const g of grps) {
        await runSqlite('INSERT OR IGNORE INTO groups (id, tour_id, name, leader_name, leader_phone, color_hex, walking_preference, avg_age, common_interests, compatibility_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', g);
    }

    const tourists = [
        ['trt_1', 'usr_tourist_1', 'tour_ooty_nilgiris', 'grp_alpha', 'Aarav Nambiar', 27, 'Male', 'Tamil', 'Fast', 'Adventurous', 'Photography, Trekking, Wildlife', 'None', 'Anjali Nambiar', '+91 98451 11001', 11.4192, 76.7115, 'ACTIVE'],
        ['trt_2', 'usr_tourist_2', 'tour_ooty_nilgiris', 'grp_alpha', 'Priya Sharma', 25, 'Female', 'English', 'Fast', 'Adventurous', 'Mountain biking, Landscapes, Camping', 'None', 'Mohit Sharma', '+91 98451 11002', 11.4194, 76.7118, 'ACTIVE'],
        ['trt_3', 'usr_tourist_3', 'tour_ooty_nilgiris', 'grp_alpha', 'Siddharth Roy', 29, 'Male', 'Hindi', 'Fast', 'Nature', 'Bird watching, Botany, Trail Running', 'None', 'Sunita Roy', '+91 98451 11003', 11.4188, 76.7110, 'ACTIVE'],
        ['trt_4', 'usr_tourist_4', 'tour_ooty_nilgiris', 'grp_alpha', 'Ananya Patel', 26, 'Female', 'Gujarati', 'Fast', 'Adventurous', 'Trekking, Rock climbing, Vlogging', 'None', 'Hitesh Patel', '+91 98451 11004', 11.4190, 76.7120, 'ACTIVE'],
        ['trt_5', 'usr_tourist_5', 'tour_ooty_nilgiris', 'grp_alpha', 'Karthik Raja', 28, 'Male', 'Tamil', 'Fast', 'Nature', 'Off-road exploration, Astronomy, Drone filming', 'None', 'Selvi Raja', '+91 98451 11005', 11.4195, 76.7116, 'ACTIVE'],
        ['trt_6', 'usr_tourist_6', 'tour_ooty_nilgiris', 'grp_beta', 'Deepa Nair', 39, 'Female', 'Malayalam', 'Moderate', 'Cultural', 'Colonial History, Museums, Local Cuisine', 'None', 'Radhakrishnan N', '+91 98451 22001', 11.4180, 76.7100, 'ACTIVE'],
        ['trt_7', 'usr_tourist_7', 'tour_ooty_nilgiris', 'grp_beta', 'Rohan Verma', 41, 'Male', 'Hindi', 'Moderate', 'Cultural', 'Antiques, Colonial Architecture, Tea Blending', 'None', 'Shalini Verma', '+91 98451 22002', 11.4184, 76.7105, 'ACTIVE'],
        ['trt_8', 'usr_tourist_8', 'tour_ooty_nilgiris', 'grp_beta', 'Kavitha Reddy', 37, 'Female', 'Telugu', 'Moderate', 'Cultural', 'Handicrafts, Architecture, Heritage', 'None', 'Prabhakar Reddy', '+91 98451 22003', 11.4182, 76.7103, 'ACTIVE'],
        ['trt_9', 'usr_tourist_9', 'tour_ooty_nilgiris', 'grp_beta', 'Arjun Deshmukh', 34, 'Male', 'Marathi', 'Moderate', 'Cultural', 'Tea tasting, Colonial libraries, Photography', 'None', 'Pooja Deshmukh', '+91 98451 22004', 11.4181, 76.7108, 'ACTIVE'],
        ['trt_10', 'usr_tourist_10', 'tour_ooty_nilgiris', 'grp_beta', 'Sneha Menon', 33, 'Female', 'Malayalam', 'Moderate', 'Nature', 'Eco-farms, Spice gardens, Photography', 'None', 'Ajay Menon', '+91 98451 22005', 11.4186, 76.7102, 'ACTIVE'],
        ['trt_11', 'usr_tourist_11', 'tour_ooty_nilgiris', 'grp_gamma', 'Suresh Hegde', 62, 'Male', 'Kannada', 'Slow', 'Relaxed', 'Botanical gardens, Meditation, Tea Tasting', 'Walking Cane', 'Raghav Hegde', '+91 98451 33001', 11.4175, 76.7092, 'ACTIVE'],
        ['trt_12', 'usr_tourist_12', 'tour_ooty_nilgiris', 'grp_gamma', 'Meera Subramanian', 59, 'Female', 'Tamil', 'Slow', 'Relaxed', 'Spiritual sites, Flower shows, Classical music', 'Needs ramp access', 'Kalyanaraman S', '+91 98451 33002', 11.4173, 76.7090, 'ACTIVE'],
        ['trt_13', 'usr_tourist_13', 'tour_ooty_nilgiris', 'grp_gamma', 'Girish Kulkarni', 65, 'Male', 'Kannada', 'Slow', 'Relaxed', 'Lake promenades, Bird listening, History books', 'Mild arthritis', 'Manjula K', '+91 98451 33003', 11.4174, 76.7088, 'ACTIVE'],
        ['trt_14', 'usr_tourist_14', 'tour_ooty_nilgiris', 'grp_gamma', 'Venkatesh Rao', 61, 'Male', 'Telugu', 'Slow', 'Relaxed', 'Herbal gardens, Souvenirs, Calm viewpoints', 'Mild asthma', 'Laxmi Rao', '+91 98451 33004', 11.4172, 76.7094, 'ACTIVE'],
        ['trt_15', 'usr_tourist_15', 'tour_ooty_nilgiris', 'grp_gamma', 'Amitabh Sen', 58, 'Male', 'English', 'Slow', 'Relaxed', 'Historical archives, Tea factory, Scenic drives', 'None', 'Rupa Sen', '+91 98451 33005', 11.4176, 76.7091, 'ACTIVE']
    ];
    for (const t of tourists) {
        await runSqlite('INSERT OR IGNORE INTO tourists (id, user_id, tour_id, group_id, name, age, gender, preferred_language, walking_preference, activity_preference, interests, accessibility_requirements, emergency_contact_name, emergency_contact_phone, current_latitude, current_longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', t);
    }

    const members = [
        ['gm_1', 'grp_alpha', 'trt_1', 96],
        ['gm_2', 'grp_alpha', 'trt_2', 95],
        ['gm_3', 'grp_alpha', 'trt_3', 94],
        ['gm_4', 'grp_alpha', 'trt_4', 97],
        ['gm_5', 'grp_alpha', 'trt_5', 93],
        ['gm_6', 'grp_beta', 'trt_6', 92],
        ['gm_7', 'grp_beta', 'trt_7', 91],
        ['gm_8', 'grp_beta', 'trt_8', 90],
        ['gm_9', 'grp_beta', 'trt_9', 94],
        ['gm_10', 'grp_beta', 'trt_10', 93],
        ['gm_11', 'grp_gamma', 'trt_11', 88],
        ['gm_12', 'grp_gamma', 'trt_12', 90],
        ['gm_13', 'grp_gamma', 'trt_13', 87],
        ['gm_14', 'grp_gamma', 'trt_14', 86],
        ['gm_15', 'grp_gamma', 'trt_15', 89]
    ];
    for (const m of members) {
        await runSqlite('INSERT OR IGNORE INTO group_members (id, group_id, tourist_id, compatibility_score) VALUES (?, ?, ?, ?)', m);
    }

    const acts = [
        ['act_1', 'tour_ooty_nilgiris', 'dest_1', 'Botanical Garden Heritage Walk', 'Guided morning exploration of 175-year-old exotic trees, ferns and Italian floral terrace.', 'sightseeing', 90, 150.00, 1, 'act_fb_1', 11.4190, 76.7112, 'SCHEDULED'],
        ['act_2', 'tour_ooty_nilgiris', 'dest_2', 'Factory Floor Tea Processing & Tasting', 'Step-by-step leaf-to-cup tea production viewing, CTC factory machinery, and specialty Nilgiri black tea degustation.', 'indoor', 75, 250.00, 0, null, 11.4230, 76.7320, 'SCHEDULED'],
        ['act_3', 'tour_ooty_nilgiris', 'dest_3', 'Doddabetta Summit & Shola Ridge Walk', 'Panoramic vista point trek along Shola ridge with telescope house viewing.', 'outdoor', 105, 100.00, 1, 'act_fb_2', 11.4010, 76.7350, 'SCHEDULED'],
        ['act_4', 'tour_ooty_nilgiris', 'dest_4', 'Ooty Lake Rowboating & Sunset Promenade', 'Lakeside boating and sunset walk along eucalyptus groves.', 'outdoor', 60, 200.00, 1, 'act_fb_3', 11.4050, 76.6900, 'SCHEDULED'],
        ['act_fb_1', 'tour_ooty_nilgiris', 'dest_1', 'Government Museum & Art Conservatory (Indoor)', 'Covered cultural museum displaying Toda tribal artifacts, stone sculptures and botanical paintings.', 'indoor', 90, 100.00, 0, null, 11.4150, 76.7050, 'SCHEDULED'],
        ['act_fb_2', 'tour_ooty_nilgiris', 'dest_2', 'Tea Museum Multimedia Cinema & Indoor Blending', 'Indoor documentary screening on Nilgiri tea history followed by custom tea blending workshop.', 'indoor', 90, 200.00, 0, null, 11.4235, 76.7325, 'SCHEDULED'],
        ['act_fb_3', 'tour_ooty_nilgiris', 'dest_4', 'Nilgiri Chocolate Masterclass & Artisan Lounge', 'Indoor homemade chocolate tasting, tempering demo, and coffee lounge experience.', 'indoor', 60, 250.00, 0, null, 11.4070, 76.6920, 'SCHEDULED']
    ];
    for (const a of acts) {
        await runSqlite('INSERT OR IGNORE INTO activities (id, tour_id, destination_id, title, description, activity_type, duration_minutes, cost, is_weather_sensitive, fallback_activity_id, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', a);
    }

    await runSqlite('INSERT OR IGNORE INTO itineraries (id, tour_id, group_id, day_number, date, title, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['itin_day1_main', 'tour_ooty_nilgiris', null, 1, '2026-09-01', 'Day 1: Flora, Mountain Mist & Nilgiri Aromas', 'ACTIVE']);

    const items = [
        ['ii_1', 'itin_day1_main', null, '08:00', '09:00', 'Welcome Breakfast & Group Briefing', 'Fresh South Indian buffet and day itinerary introduction with multilingual voice assistant setup.', 'Hotel Savoy Ooty', 11.4080, 76.7000, 0, 1, 'COMPLETED', null],
        ['ii_2', 'itin_day1_main', 'act_1', '09:30', '11:45', 'Botanical Garden Heritage Walk', 'Guided botanical walk through Italian Garden and Toda Arboretum.', 'Ooty Botanical Gardens', 11.4190, 76.7112, 0, 2, 'IN_PROGRESS', null],
        ['ii_3', 'itin_day1_main', null, '12:15', '01:30', 'Nilgiri Traditional Thali Lunch', 'Authentic regional feast at Shinkows Heritage Hall.', 'Commercial Road', 11.4110, 76.7030, 0, 3, 'SCHEDULED', null],
        ['ii_4', 'itin_day1_main', 'act_2', '01:45', '03:15', 'Nilgiri Tea Estate & Museum Tour', 'Factory floor machinery tour, tea leaf picking and tasting.', 'Dodabetta Tea Estate', 11.4230, 76.7320, 0, 4, 'SCHEDULED', null],
        ['ii_5', 'itin_day1_main', 'act_3', '03:45', '05:30', 'Doddabetta Peak & Telescope Observation', 'Sweeping vistas of the Western Ghats and pine ridge trail.', 'Doddabetta Summit', 11.4010, 76.7350, 0, 5, 'SCHEDULED', 'Rain alert: Rain probability 75% between 14:00 - 17:00'],
        ['ii_6', 'itin_day1_main', 'act_4', '06:00', '07:30', 'Ooty Boathouse & Lake Promenade', 'Rowboat ride and evening handicraft bazaar.', 'Ooty Lake', 11.4050, 76.6900, 0, 6, 'SCHEDULED', null]
    ];
    for (const it of items) {
        await runSqlite('INSERT OR IGNORE INTO itinerary_items (id, itinerary_id, activity_id, start_time, end_time, title, description, location_name, latitude, longitude, is_alternative, order_index, status, weather_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', it);
    }

    await runSqlite('INSERT OR IGNORE INTO emergencies (id, tourist_id, tour_id, group_id, latitude, longitude, emergency_type, message, status, priority, assigned_responder, resolution_notes, reported_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['emg_sample_1', 'trt_6', 'tour_ooty_nilgiris', 'grp_gamma', 11.4175, 76.7092, 'MOBILITY_ASSIST', 'Mild dizziness due to high altitude at botanical garden upper terrace.', 'RESOLVED', 'HIGH', 'First Responder Murugan', 'Administered hydration and glucose. Transported back to hotel lounge in electric golf cart. Tourist fully stable.', '2026-08-27 10:15:00', '2026-08-27 10:45:00']);

    await runSqlite('INSERT OR IGNORE INTO emergency_expenses (id, emergency_id, transport_type, estimated_distance_km, estimated_cost_min, estimated_cost_max, actual_cost, reserve_available, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['ee_1', 'emg_sample_1', 'Electric Golf Cart / Local Transit', 3.5, 450.00, 800.00, 500.00, 24500.00, 'Local garden support vehicle and emergency medical kit utilized.']);

    await runSqlite('INSERT OR IGNORE INTO tour_costs (id, tour_id, tourist_count, transportation_cost, accommodation_cost, food_cost, activity_cost, guide_cost, misc_cost, contingency_cost, total_cost, per_person_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['tc_1', 'tour_ooty_nilgiris', 16, 42000.00, 68000.00, 36000.00, 18400.00, 12000.00, 4600.00, 10000.00, 191000.00, 11937.50]);

    await runSqlite('INSERT OR IGNORE INTO ai_recommendations (id, tour_id, agent_source, recommendation_text, reason, confidence_score, affected_groups, affected_activities, suggested_alternative, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['rec_init_1', 'tour_ooty_nilgiris', 'Coordinator Agent (Gemini + Weather + Route)', 'Heavy afternoon rain shower (75% probability, 14mm/h) predicted near Doddabetta Peak between 2:00 PM and 4:30 PM. Postpone outdoor summit walk and reroute Group Alpha & Beta to the Indoor Tea Museum Multimedia Cinema and Artisan Chocolate Masterclass.', 'Weather Agent detected rapid cloud condensation over Doddabetta Ridge. Route Agent confirmed Doddabetta Ghat road is slippery. Itinerary Agent verified indoor capacity at Tea Museum is open with zero wait time.', 0.94, 'Alpha - Nature Trekkers, Beta - Heritage & Culture', 'Doddabetta Peak Walk (Outdoor)', 'Tea Museum Multimedia Cinema & Artisan Chocolate Tasting (Indoor)', 'PENDING']);

    console.log('[DB] Seed data loaded successfully.');
}

async function initDb() {
    if (isInitialized) return;

    if (process.env.DB_HOST && process.env.DB_USER) {
        try {
            console.log('[DB] Attempting connection to MySQL server at', process.env.DB_HOST);
            mysqlPool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'intelligent_tourism_db',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            await mysqlPool.query('SELECT 1');
            dbType = 'mysql';
            isInitialized = true;
            console.log('[DB] Successfully connected to MySQL database.');
            return;
        } catch (err) {
            console.warn('[DB] MySQL connection failed. Gracefully falling back to SQLite.', err.message);
        }
    }

    dbType = 'sqlite';
    await initSqlite();
}

/**
 * Unified query method compatible with both MySQL and SQLite
 */
async function query(sql, params = []) {
    if (!isInitialized) {
        await initDb();
    }
    if (dbType === 'mysql') {
        const [rows] = await mysqlPool.execute(sql, params);
        return rows;
    } else {
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
            return await allSqlite(sql, params);
        } else {
            const res = await runSqlite(sql, params);
            return res;
        }
    }
}

module.exports = {
    initDb,
    query,
    getDbType: () => dbType
};
