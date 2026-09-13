const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

const authRoutes = require('./controller/authController');
const userRoutes = require('./controller/userController');
const chatRoutes = require('./controller/chatController');
const messageController = require('./controller/messageController');

// ─────────────────────────────────────────────────────────
// 1. Security HTTP Headers (Helmet)
// ─────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ─────────────────────────────────────────────────────────
// 2. CORS Configuration
// ─────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server requests (no origin) or listed origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else if (process.env.NODE_ENV !== 'production') {
            // Permissive in development
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─────────────────────────────────────────────────────────
// 3. Body Parsing & NoSQL Injection Protection
// ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Custom NoSQL Injection Protection Middleware (Express 5 safe)
function sanitizeNoSQL(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            sanitizeNoSQL(obj[key]);
        }
    }
}

app.use((req, res, next) => {
    if (req.body) sanitizeNoSQL(req.body);
    if (req.params) sanitizeNoSQL(req.params);
    if (req.query && typeof req.query === 'object') sanitizeNoSQL(req.query);
    next();
});

// ─────────────────────────────────────────────────────────
// 4. Rate Limiting
// ─────────────────────────────────────────────────────────
// General rate limiter for all API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

// Stricter rate limiter for Authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 auth requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─────────────────────────────────────────────────────────
// 5. Health Check Endpoint
// ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatusMap[dbState] || 'unknown',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ─────────────────────────────────────────────────────────
// 6. Application Routes
// ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageController);

// ─────────────────────────────────────────────────────────
// 7. 404 Handler for Unknown Routes
// ─────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: `Cannot ${req.method} ${req.originalUrl} - Route not found!`
    });
});

// ─────────────────────────────────────────────────────────
// 8. Global Centralized Error Handling Middleware
// ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;