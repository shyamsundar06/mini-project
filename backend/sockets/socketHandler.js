const { Server } = require('socket.io');

function setupSockets(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        socket.on('join:room', (room) => {
            socket.join(room);
            console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
        });

        socket.on('tourist:location_push', (data) => {
            // Broadcast live location update to all operators
            socket.broadcast.emit('location:update', data);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });
}

function initSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    setupSockets(io);
    return io;
}

module.exports = {
    initSocketServer,
    setupSockets
};
