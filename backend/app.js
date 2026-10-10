const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const tourRoutes = require('./routes/tourRoutes');
const touristRoutes = require('./routes/touristRoutes');
const groupRoutes = require('./routes/groupRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const locationRoutes = require('./routes/locationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');

const app = express();

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database initialization middleware
app.use(async (req, res, next) => {
    try {
        await initDb();
        next();
    } catch (err) {
        console.error('[DB Init Error in middleware]:', err);
        next();
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/broadcasts', broadcastRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'Intelligent Tourism Management API',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
