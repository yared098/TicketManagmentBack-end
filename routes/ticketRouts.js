const express = require('express');
const { 
  createTicket, 
  getTickets, 
  getTicketById, 
  updateTicket, 
  deleteTicket ,
  getMyTickets,
  getAllTickets
} = require('../controllers/ticketControler');
const checkAuth = require('../middlewares/authMiddleware');

const router = express.Router();

// Get my tickets (user-specific)
router.get('/my/:id', async (req, res) => {
    await getMyTickets(req, res);
});


// Get all tickets (default behavior)
router.get('/', async (req, res) => {
    await getAllTickets(req, res);
});


// Route to get all tickets
router.get('/', async (req, res) => {
    await getTickets(req, res);
});

// Route to create a new ticket
router.post('/', async (req, res) => {
    await createTicket(req, res);
});

// Route to get a ticket by ID
router.get('/:id', async (req, res) => {
    await getTicketById(req, res);
});

// Route to update a ticket
router.put('/:id', async (req, res) => {
    console.log("Ticket ID:", req.params.id); // Log ticket ID to verify it is correc
    await updateTicket(req, res);
});

// Route to delete a ticket
router.delete('/:id', async (req, res) => {
    await deleteTicket(req, res);
});

module.exports = router;
