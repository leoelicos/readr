/* 

Book Search Engine
connection.js

Configure mongoose to connect to mongoDB Atlas in production mode on Heroku, otherwise a local path 

*/

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/readr', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

module.exports = mongoose.connection
