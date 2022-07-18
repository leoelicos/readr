const mongoose = require('mongoose');
require('dotenv');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/googlebooks', {});

module.exports = mongoose.connection;
