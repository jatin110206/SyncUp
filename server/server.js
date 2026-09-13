const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'config.env') });
const express = require('express');

const db = require('./config/dbConfig');
const app = require('./app');

const PORT = process.env.PORT_NUMBER || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
