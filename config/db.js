const mongoose = require('mongoose');
const mysql = require('mysql2');
const firebaseAdmin = require('firebase-admin');
const config = require('./config');

const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL; // Example: 'https://wkhqajyiopjwwnfdykya.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY; // Your Supabase service role key or public API key

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;


const connectDB = async (app) => {
  const dbType = config.DB_TYPE;

  try {
    // Set the dbType in app.locals for later use
    app.locals.dbType = dbType; // Storing dbType in app.locals

    switch (dbType) {
      case 'mongodb':
        const mongoConnection = await mongoose.connect(config.MONGO_URI);
        console.log('MongoDB connected successfully');
        app.locals.db = mongoConnection.connection.db; // Store MongoDB instance
        break;

      case 'mysql':
        const mysqlConnection = mysql.createConnection({
          host: config.MYSQL_HOST,
          user: config.MYSQL_USER,
          password: config.MYSQL_PASSWORD,
          database: config.MYSQL_DB,
        });
        mysqlConnection.connect((err) => {
          if (err) throw err;
          console.log('MySQL connected successfully');
        });
        app.locals.db = mysqlConnection; // Store MySQL connection
        break;

      case 'supabase':
        // No need for 'new Client' here, just use the already initialized supabase client
        console.log('Supabase client already initialized');
        app.locals.db = supabase; // Store Supabase client (already initialized)
        break;

      case 'firebase':
        const serviceAccount = require('../config/serviceAccount.json'); // Adjust the path if needed
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount),
          databaseURL: config.FIREBASE_DB_URL,
        });
        console.log('Firebase connected successfully');
        app.locals.db = firebaseAdmin.firestore(); // Use Firestore for Firebase
        break;

      default:
        throw new Error('Unsupported database type');
    }
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
