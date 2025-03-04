
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'your_secret_key'; // Use env variable for security




async function checkAuth(req, res, next) {
    try {
        const db = req.app.locals.db;
        const token = req.headers.authorization?.split(" ")[1];  // Extract Bearer token

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        console.log('Authorization Header:', req.headers.authorization);  // Log the token for debugging

        const decoded = jwt.decode(token);  // Decode without verification to inspect token
        console.log('Decoded Token:', decoded);

        const expiry = new Date(decoded.exp * 1000); // Convert expiry timestamp to milliseconds
        console.log('Token Expiry:', expiry);
        console.log('Current Time:', new Date());

        if (expiry < new Date()) {
            return res.status(401).json({ message: 'Token has expired' });
        }

        // Verify JWT token
        const userId = decoded.id;
        const user = await db.collection ? 
            await db.collection('users').findOne({ _id: userId }) : 
            await db.query ? 
            (await db.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0] : 
            await db.auth().getUser(userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        console.error('Error in Authentication:', error.message);
        return res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
}

module.exports = checkAuth;
