const Customer = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'your_secret_key'; // Use env variable for security


async function getUsers(req, res) {
    try {
        const db = req.app.locals.db;
        const dbType = req.app.locals.dbType; // Get database type (firebase, mongodb, etc.)
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Calculate the number of records to skip for pagination
        let customers;

        console.log("DB TYPE", dbType);

        if (dbType === 'mongodb') {
            // MongoDB logic with pagination
            customers = await db.collection('users')
                .find()
                .skip(skip)
                .limit(limit)
                .toArray();
        }
        else if (dbType === 'mysql') {
            // MySQL logic with pagination
            const result = await db.promise().query('SELECT * FROM users LIMIT ?, ?', [skip, limit]);
            customers = result[0];  // Rows returned from the query
        }
        else if (dbType === 'supabase') {
            // Supabase (PostgreSQL) logic with pagination
            const { data, error } = await db.from('users').select('*').range(skip, skip + limit - 1);

            if (error) throw new Error(error.message);

            customers = data;
        }
        else if (dbType === 'firebase') {
            // Firebase logic with pagination (FireStore)
            const snapshot = await db.collection('users')
                .offset(skip)
                .limit(limit)
                .get();
            customers = snapshot.docs.map(doc => doc.data());
        }
        else {
            throw new Error('Unsupported database type');
        }

        // Get the total number of records for pagination info
        let totalCount;
        if (dbType === 'mongodb') {
            totalCount = await db.collection('users').countDocuments();
        } else if (dbType === 'mysql' || dbType === 'supabase') {
            const countResult = await db.query('SELECT COUNT(*) as total FROM users');
            totalCount = countResult[0][0].total;
        } else if (dbType === 'firebase') {
            totalCount = (await db.collection('users').get()).size;
        }

        res.status(200).json({
            data: customers,
            pagination: {
                page,
                limit,
                totalCount,
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
}


const createUser = async (req, res) => {
    const db = req.app.locals.db; // Get database instance
    const dbType = req.app.locals.dbType; // Get database type (firebase, mongodb, etc.)
    console.log("DB TYPE", dbType);

    try {
        const { password, ...userData } = req.body; // Destructure password from other user data

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10); // Adjust the salt rounds if necessary

        // Prepare user data with hashed password
        const userWithHashedPassword = { ...userData, password: hashedPassword };

        let newUser;

        if (dbType === 'firebase') {
            // Firebase-specific logic (using Firestore)
            const customerRef = db.collection('users').doc(); // Firestore example
            await customerRef.set(userWithHashedPassword); // Set customer data with hashed password
            newUser = { id: customerRef.id, ...userWithHashedPassword }; // Assuming customerRef.id is the user ID
        } else if (dbType === 'mongodb') {
            // MongoDB logic
            const newCustomer = new Customer(userWithHashedPassword); // Use hashed password
            await newCustomer.save();
            newUser = newCustomer; // Assuming newCustomer has _id
        } else if (dbType === 'mysql') {
            // MySQL logic
            const [rows] = await db.promise().query('INSERT INTO users SET ?', userWithHashedPassword);
            newUser = { id: rows.insertId, ...userWithHashedPassword }; // Assuming insertId is the user ID
        } else if (dbType === 'supabase') {
            // Supabase logic (PostgreSQL)
            const { data, error } = await db
                .from('users')
                .insert([userWithHashedPassword]);

            if (error) throw new Error(error.message);
            newUser = data[0]; // Assuming the data array contains the newly created user
        } else {
            throw new Error('Unsupported database type');
        }

        // Generate JWT token
        const token = jwt.sign({ id: newUser.id }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour

        // Send response with the token
        res.status(200).json({
            message: 'User created successfully',
            token: token, // Send the generated JWT token
            user: newUser // Optionally send user data in the response
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};



async function getUserById(req, res) {
    try {
        const db = req.app.locals.db;
        const dbType = req.app.locals.dbType; // Get database type (firebase, mongodb, etc.)
        const customerId = req.params.id;
        let customer;

        // MongoDB logic
        if (dbType === 'mongodb') {
            customer = await db.collection('users').findOne({ _id: new db.ObjectId(customerId) });
        }
        // PostgreSQL logic
        else if (dbType === 'mysql' || dbType === 'supabase') {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [customerId]);
            customer = result.rows[0];
        }
        // Firebase Firestore logic
        else if (dbType === 'firebase') {
            const doc = await db.collection('users').doc(customerId).get();
            if (doc.exists) {
                customer = doc.data();
            }
        }

        // If customer not found, return 404
        if (!customer) {
            return res.status(404).json({ message: 'users not found' });
        }

        // Return the customer data
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
}


async function updateUser(req, res) {
    try {
        const db = req.app.locals.db;
        const dbType = req.app.locals.dbType; // Get database type (firebase, mongodb, etc.)
        const customerId = req.params.id;
        const updatedData = req.body;

        // MongoDB logic
        if (dbType === 'mongodb') {
            await db.collection('users').updateOne({ _id: new db.ObjectId(customerId) }, { $set: updatedData });
        }
        // PostgreSQL logic (Supabase uses PostgreSQL)
        else if (dbType === 'mysql' || dbType === 'supabase') {
            await db.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [updatedData.name, updatedData.email, customerId]);
        }
        // Firebase Firestore logic
        else if (dbType === 'firebase') {
            await db.collection('users').doc(customerId).update(updatedData);
        } else {
            throw new Error('Unsupported database type');
        }

        res.status(200).json({ message: 'users updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Error updating users', error: error.message });
    }
}



async function deleteUser(req, res) {
    try {
        const db = req.app.locals.db;
        const dbType = req.app.locals.dbType; // Get database type (firebase, mongodb, etc.)
        const customerId = req.params.id;

        // MongoDB delete logic
        if (dbType === 'mongodb') {
            await db.collection('users').deleteOne({ _id: new db.ObjectId(customerId) });
        }
        // PostgreSQL (Supabase uses PostgreSQL) delete logic
        else if (dbType === 'mysql' || dbType === 'supabase') {
            await db.query('DELETE FROM users WHERE id = $1', [customerId]);
        }
        // Firebase Firestore delete logic
        else if (dbType === 'firebase') {
            await db.collection('users').doc(customerId).delete();
        } else {
            throw new Error('Unsupported database type');
        }

        res.status(200).json({ message: 'users deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Error deleting users', error: error.message });
    }
}


async function login(req, res) {
    console.log('login route');
    try {
        const db = req.app.locals.db;
        const dbType = req.app.locals.dbType;
        const { email, password } = req.body;
        let user;
        if (dbType === 'mongodb') {
            // If _id is needed as ObjectId, use ObjectId(email) or adjust accordingly
            user = await db.collection('users').findOne({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }
        
        else if (dbType === 'mysql') {
            const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
            user = rows[0];
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        } else if (dbType === 'supabase') {
            const { data, error } = await db.from('users').select('*').eq('email', email).single();
            if (error || !(await bcrypt.compare(password, data.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            user = data;
        } else if (dbType === 'firebase') {
            const userRecord = await db.auth().getUserByEmail(email);
            if (!userRecord) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            user = { email: userRecord.email, uid: userRecord.uid };
        } else {
            return res.status(400).json({ message: 'Unsupported database type' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, 'your_secret_key', { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
}

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    login
};