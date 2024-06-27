const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const SessionMongoDB = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions',
});

SessionMongoDB.on('error', function (error) {
  console.error('Session SessionMongoDB error:', error);
});

module.exports = SessionMongoDB;
