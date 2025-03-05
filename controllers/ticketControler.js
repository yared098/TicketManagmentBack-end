const Ticket = require('../models/ticketModel');
const { ObjectId } = require('mongodb'); // Ensure ObjectId is imported

async function createTicket(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    
    try {
        if (dbType === 'firebase') {
            // Firebase Firestore logic
            const ticketRef = db.collection('tickets').doc();
            await ticketRef.set(req.body);
            res.status(200).json({ message: 'Ticket created successfully' });
        } else if (dbType === 'mongodb') {
            // MongoDB logic using Mongoose
            const newTicket = new Ticket(req.body);
            await newTicket.save();
            res.status(200).json({ message: 'Ticket created successfully' });
        } else if (dbType === 'mysql') {
            // MySQL logic
            const [rows] = await db.promise().query('INSERT INTO tickets SET ?', req.body);
            res.status(200).json({ message: 'Ticket created successfully' });
        } else if (dbType === 'supabase') {
            // Supabase (PostgreSQL) logic
            const { data, error } = await db
                .from('tickets')
                .insert([req.body]);
            if (error) throw new Error(error.message);
            res.status(200).json({ message: 'Ticket created successfully', data });
        } else {
            throw new Error('Unsupported database type');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating ticket', error: error.message });
    }
}

async function getTickets(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;

    try {
        let tickets;
        // Check user's role from the authenticated request (assumed to be set in req.user)
        if (req.user && req.user.role === 'admin') {
            // Admin sees all tickets
            if (dbType === 'mongodb') {
                tickets = await db.collection('tickets').find().toArray();
            } else if (dbType === 'firebase') {
                const snapshot = await db.collection('tickets').get();
                tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else if (dbType === 'mysql' || dbType === 'supabase') {
                const result = await db.query('SELECT * FROM tickets');
                tickets = result[0] || result.rows;
            }
        } else {
            // Regular users see only their own tickets
            const userId = req.user.id;
            if (dbType === 'mongodb') {
                tickets = await db.collection('tickets').find({ createdBy: userId }).toArray();
            } else if (dbType === 'firebase') {
                const snapshot = await db.collection('tickets').where('createdBy', '==', userId).get();
                tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else if (dbType === 'mysql' || dbType === 'supabase') {
                const result = await db.query('SELECT * FROM tickets WHERE createdBy = ?', [userId]);
                tickets = result[0] || result.rows;
            }
        }
        res.status(200).json({ data: tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
}


async function updateTicket(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    const ticketId = req.params.id;  // This is the ticket ID passed in the URL
    const updatedData = req.body;    // The updated data sent from the frontend

    try {
        if (dbType === 'mongodb') {
            // No need to convert ticketId to ObjectId since it's stored as a string
            const result = await db.collection('tickets').updateOne(
                { ticket_id: ticketId },  // Directly compare ticket_id as string
                { $set: updatedData }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: 'No ticket found to update' });
            }

            // Fetch the updated ticket to return it
            const updatedTicket = await db.collection('tickets').findOne({ ticket_id: ticketId });

            return res.status(200).json(updatedTicket);

        } else if (dbType === 'firebase') {
            await db.collection('tickets').doc(ticketId).update(updatedData);
        } else if (dbType === 'mysql') {
            await db.promise().query('UPDATE tickets SET ? WHERE id = ?', [updatedData, ticketId]);
        } else if (dbType === 'supabase') {
            const { error } = await db.from('tickets').update(updatedData).eq('id', ticketId);
            if (error) throw new Error(error.message);
        } else {
            throw new Error('Unsupported database type');
        }

        res.status(200).json({ message: 'Ticket updated successfully' });

    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Error updating ticket', error: error.message });
    }
}




async function deleteTicket(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    const ticketId = req.params.id; // Assuming the ticket ID is sent as a URL parameter

    try {
        if (!ticketId) {
            return res.status(400).json({ message: 'Ticket ID is required' });
        }

        let result;

        switch (dbType) {
            case 'firebase':
                // Firebase Firestore deletion
                await db.collection('tickets').doc(ticketId).delete();
                result = { message: 'Ticket deleted successfully' };
                break;

            case 'mongodb':
                // MongoDB deletion using Mongoose or native MongoDB driver

                const objectId = ObjectId.isValid(ticketId) ? new ObjectId(ticketId) : ticketId; 
                
                const deletedTicket = await db.collection('tickets').deleteOne({ ticket_id: ticketId });
                if (deletedTicket.deletedCount === 0) {
                    return res.status(404).json({ message: 'Ticket not found' });
                }
                result = { message: 'Ticket deleted successfully' };
                break;

            case 'mysql':
                // MySQL deletion
                const [mysqlResult] = await db.promise().query('DELETE FROM tickets WHERE ticket_id = ?', [ticketId]);
                if (mysqlResult.affectedRows === 0) {
                    return res.status(404).json({ message: 'Ticket not found' });
                }
                result = { message: 'Ticket deleted successfully' };
                break;

            case 'supabase':
                // Supabase (PostgreSQL) deletion
                const { data, error } = await db
                    .from('tickets')
                    .delete()
                    .eq('ticket_id', ticketId);
                if (error) {
                    throw new Error(error.message);
                }
                result = { message: 'Ticket deleted successfully', data };
                break;

            default:
                return res.status(400).json({ message: 'Unsupported database type' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Error deleting ticket', error: error.message });
    }
}



async function getTicketById(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    const ticketId = req.params.id;

    try {
        let ticket;
        
        if (dbType === 'mongodb') {
            // MongoDB: Fetch ticket using Mongoose
            ticket = await Ticket.findById(ticketId);
            if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        } else if (dbType === 'firebase') {
            // Firebase Firestore: Fetch ticket by document ID
            const ticketDoc = await db.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) return res.status(404).json({ message: 'Ticket not found' });
            ticket = { id: ticketDoc.id, ...ticketDoc.data() };

        } else if (dbType === 'mysql') {
            // MySQL: Fetch ticket by ID
            const [rows] = await db.promise().query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
            if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found' });
            ticket = rows[0];

        } else if (dbType === 'supabase') {
            // Supabase (PostgreSQL): Fetch ticket by ID
            const { data, error } = await db.from('tickets').select('*').eq('id', ticketId).single();
            if (error) return res.status(404).json({ message: 'Ticket not found', error: error.message });
            ticket = data;

        } else {
            throw new Error('Unsupported database type');
        }

        res.status(200).json({ data: ticket });
    } catch (error) {
        console.error('Error fetching ticket by ID:', error);
        res.status(500).json({ message: 'Error fetching ticket', error: error.message });
    }
}


async function createTicket(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    
    try {
        if (dbType === 'firebase') {
            const ticketRef = db.collection('tickets').doc();
            await ticketRef.set(req.body);
        } else if (dbType === 'mongodb') {
            const newTicket = new Ticket(req.body);
            await newTicket.save();
        } else if (dbType === 'mysql') {
            await db.promise().query('INSERT INTO tickets SET ?', req.body);
        } else if (dbType === 'supabase') {
            const { error } = await db.from('tickets').insert([req.body]);
            if (error) throw new Error(error.message);
        } else {
            throw new Error('Unsupported database type');
        }
        res.status(200).json({ message: 'Ticket created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket', error: error.message });
    }
}

async function getTickets(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;

    try {
        let tickets;
        if (req.user && req.user.role === 'admin') {
            if (dbType === 'mongodb') {
                tickets = await Ticket.find();
            } else if (dbType === 'firebase') {
                const snapshot = await db.collection('tickets').get();
                tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                const result = await db.query('SELECT * FROM tickets');
                tickets = result[0] || result.rows;
            }
        } else {
            const userId = req.user.id;
            if (dbType === 'mongodb') {
                tickets = await Ticket.find({ createdBy: userId });
            } else if (dbType === 'firebase') {
                const snapshot = await db.collection('tickets').where('createdBy', '==', userId).get();
                tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                const result = await db.query('SELECT * FROM tickets WHERE createdBy = ?', [userId]);
                tickets = result[0] || result.rows;
            }
        }
        res.status(200).json({ data: tickets });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
}

async function getMyTickets(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;
    const userId = req.params.id;
    console.log("USER ID", userId);

    try {
        let tickets;
        if (dbType === 'mongodb') {
            tickets = await Ticket.find({ createdBy: userId });
        } else if (dbType === 'firebase') {
            const snapshot = await db.collection('tickets').where('createdBy', '==', userId).get();
            tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            const result = await db.query('SELECT * FROM tickets WHERE createdBy = ?', [userId]);
            tickets = result[0] || result.rows;
        }
        res.status(200).json({ data: tickets });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user tickets', error: error.message });
    }
}

async function getAllTickets(req, res) {
    const db = req.app.locals.db;
    const dbType = req.app.locals.dbType;

    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Calculate the number of records to skip for pagination

        let tickets;

        console.log("DB TYPE", dbType);

        if (dbType === 'mongodb') {
            // MongoDB logic with pagination
            tickets = await db.collection('tickets')
                .find()
                .skip(skip)
                .limit(limit)
                .toArray();
        }
        else if (dbType === 'mysql') {
            // MySQL logic with pagination
            const result = await db.promise().query('SELECT * FROM tickets LIMIT ?, ?', [skip, limit]);
            tickets = result[0];  // Rows returned from the query
        }
        else if (dbType === 'supabase') {
            // Supabase (PostgreSQL) logic with pagination
            const { data, error } = await db.from('tickets').select('*').range(skip, skip + limit - 1);

            if (error) throw new Error(error.message);

            tickets = data;
        }
        else if (dbType === 'firebase') {
            // Firebase logic with pagination (FireStore)
            const snapshot = await db.collection('tickets')
                .offset(skip)
                .limit(limit)
                .get();
            tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        else {
            throw new Error('Unsupported database type');
        }

        // Get the total number of records for pagination info
        let totalCount;
        if (dbType === 'mongodb') {
            totalCount = await db.collection('tickets').countDocuments();
        } else if (dbType === 'mysql' || dbType === 'supabase') {
            const countResult = await db.query('SELECT COUNT(*) as total FROM tickets');
            totalCount = countResult[0][0].total;
        } else if (dbType === 'firebase') {
            totalCount = (await db.collection('tickets').get()).size;
        }

        res.status(200).json({
            data: tickets,
            pagination: {
                page,
                limit,
                totalCount,
            }
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
}

module.exports = {
    createTicket,
    getTickets,
    updateTicket,
    deleteTicket,
    getTicketById,
    getMyTickets,
    getAllTickets
};
