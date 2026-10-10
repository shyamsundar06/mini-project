const http = require('http');
const app = require('./app');
const { initSocketServer } = require('./sockets/socketHandler');
const { initDb } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Create HTTP & Socket.IO server
const server = http.createServer(app);
const io = initSocketServer(server);

// Attach io to express app instance
app.set('io', io);

// Initialize Database & Start Server
initDb()
    .then(() => {
        server.listen(PORT, () => {
            console.log('====================================================');
            console.log(`🚀 Intelligent Tourism Platform Server running on port ${PORT}`);
            console.log(`🌐 REST API: http://localhost:${PORT}/api/health`);
            console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
            console.log('====================================================');
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database on startup:', err);
        server.listen(PORT, () => {
            console.log(`Server started on port ${PORT} with fallback mode.`);
        });
    });

module.exports = { app, server, io };
