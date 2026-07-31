const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['PENDING_APPROVAL', 'ACTIVE', 'REJECTED'], default: 'PENDING_APPROVAL' },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  friends: [{ type: String }], // array of user IDs
}, { timestamps: true });

userSchema.index({ status: 1 });
userSchema.index({ username: 1, email: 1 });

module.exports = mongoose.model('User', userSchema);
