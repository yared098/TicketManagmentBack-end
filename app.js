const express = require('express');
const connectDB = require('./config/db');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRouts');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

// Environment variables
require('dotenv').config();

// Define the allowed origins for CORS
const allowedOrigins = ['https://front-ticket-managment.vercel.app']; // Add your frontend URL here

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors(corsOptions)); // Enable CORS with the specified options

// Connect to the database
connectDB(app);

// Rate limiting for specific routes
const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  message: 'Too many vendor requests, please try again later.',
});

const ticketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Max 1000 requests per minute
  message: 'Too many ticket requests, please try again later.',
});

// Routes with rate limiting
app.use('/api/auth/user', userRoutes, userLimiter);
app.use('/api/auth/tickets', ticketRoutes, ticketLimiter);

// Start the server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

module.exports = app;
