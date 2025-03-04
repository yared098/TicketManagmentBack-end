const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed'],
    default: 'Open',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Reference to your user model
    required: true,
  },
  last_updated: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);
