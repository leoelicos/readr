const mongoose = require('mongoose');
require('dotenv');
console.log('the uri is ', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/googlebooks');

module.exports = mongoose.connection;
