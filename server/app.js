const express = require('express');
const app = express();
const authRoutes = require('./controller/authController');
const userRoutes = require('./controller/userController');
const chatRoutes = require('./controller/chatController');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

module.exports = app;