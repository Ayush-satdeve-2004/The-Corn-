const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, default: '' },
  userName: { type: String, default: '' },
  category: { type: String, default: 'General Feedback' },
  rating: { type: Number, default: 5 },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
