const mongoose = require('mongoose');

mongoose.connect(process.env.DB_CONNECTION_STRING, {
    
}).then(() => {
    console.log('Database connected successfully');
}).catch((err) => {
    console.log('Database connection failed', err);
});

module.exports = mongoose;
