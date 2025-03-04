
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
  max: 3, 
  message: 'Too many vendor requests, please try again later.'
});

const ticketLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: 'Too many ticket requests, please try again later.'
});

app.use('/api/auth/user', userLimiter,userRoutes );
 
app.use('/api/auth/tickets', ticketRoutes,ticketLimiter);


// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

module.exports = app;
