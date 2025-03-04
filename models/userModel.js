const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString(),
      },
    
    fullname: {
        type: String,
        required: true,
    },
    
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
   
    phone: {
        type: Number,
        required: true,
    },
    last_updated: {
        type: Date,
    },
    address: {
        type: String,
    },
    
    role: {
        type: String,
        default: 'user',
    },
    dash_type:{
        type: String,
        default: 'user_dashboard', // different dashboard types based on role
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('user', customerSchema);



  