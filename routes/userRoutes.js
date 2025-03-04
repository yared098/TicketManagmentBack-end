const express = require('express');
const { getUsers,login, createUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();


// login here
router.post('/login', async (req, res) => {
    console.log('login route')
    await login(req, res);
});

// Route to get all customers
router.get('/', async (req, res) => {
    await getUsers(req, res);
});


// Route to create a new customer
router.post('/', async (req, res) => {
    await createUser(req, res);
});

// Route to get a customer by ID
router.get('/:id', async (req, res) => {
    await getUserById(req, res);
});

// Route to update a customer
router.put('/:id', async (req, res) => {
    await updateUser(req, res);
});

// Route to delete a customer
router.delete('/:id', async (req, res) => {
    await deleteUser(req, res);
});

module.exports = router;