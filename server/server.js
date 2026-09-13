const path = require('path');
// In production (Railway), env vars are injected by the platform — no config.env file needed
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.resolve(__dirname, 'config.env') });
}
const http = require('http');
const mongoose = require('mongoose');

const db = require('./config/dbConfig');
const app = require('./app');
const { initSocket } = require('./socket/socket');

// Process uncaught exceptions before server initialization
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

const server = http.createServer(app);

// Handle server startup errors (e.g. EADDRINUSE)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`💥 Port ${process.env.PORT_NUMBER || 3000} is already in use by another process.`);
        console.error(`Run 'lsof -ti :${process.env.PORT_NUMBER || 3000} | xargs kill -9' to free the port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Initialize Socket.io
initSocket(server);

// Railway injects PORT automatically; PORT_NUMBER is used for local dev
const PORT = process.env.PORT || process.env.PORT_NUMBER || 3000;
const listeningServer = server.listen(PORT, () => {
    console.log(`SyncUp Server is running on port ${PORT}`);
});

// Process unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    listeningServer.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown on termination signals (SIGINT, SIGTERM)
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    listeningServer.close(async () => {
        console.log('HTTP & Socket.io server closed.');
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing MongoDB connection:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
