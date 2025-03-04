require('dotenv').config();

module.exports = {
  // General configuration
  PORT: process.env.PORT || 5001,

  // MongoDB configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name',

  // MySQL configuration
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'your_password',
  MYSQL_DB: process.env.MYSQL_DB || 'your_database_name',

  // Supabase configuration (PostgreSQL)
  SUPABASE_USER: process.env.SUPABASE_USER || 'your_supabase_user',
  SUPABASE_HOST: process.env.SUPABASE_HOST || 'your_supabase_host',
  SUPABASE_DB: process.env.SUPABASE_DB || 'your_supabase_db',
  SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD || 'your_supabase_password',
  SUPABASE_PORT: process.env.SUPABASE_PORT || 'your_supabase_port',

  // Firebase configuration
  FIREBASE_DB_URL: process.env.FIREBASE_DB_URL || 'https://your-firebase-db.firebaseio.com',

  // DB_TYPE specifies the type of database (mongodb, mysql, supabase, firebase, etc.)
  DB_TYPE: process.env.DB_TYPE  // Set your DB type here
};
