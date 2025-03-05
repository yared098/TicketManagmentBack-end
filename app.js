
const express = require('express');
const connectDB = require('./config/db');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRouts');
const cors = require("cors");
const rateLimit = require('express-rate-limit'); 
const app = express();

// Middleware
app.use(express.json()); // To parse JSON request bodies

// Connect to database
connectDB(app);

app.use(cors());

require('dotenv').config(); 
// limit request per seconds 

const userLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  message: 'Too many vendor requests, please try again later.'
});

const ticketLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 1000, 
  message: 'Too many ticket requests, please try again later.'
});

app.use('/api/auth/user',userRoutes ,userLimiter);
 
app.use('/api/auth/tickets', ticketRoutes,tiketLimiter);


// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

module.exports = app;
