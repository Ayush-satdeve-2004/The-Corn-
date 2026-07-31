const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  timestamp: { type: Number, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
