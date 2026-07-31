const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['photo', 'video', 'text'], required: true },
  content: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  gradient: { type: String, default: null },
  likes: [{ type: String }],        // array of user IDs
  comments: [commentSchema],
  saves: [{ type: String }],        // array of user IDs
  timestamp: { type: Number, default: Date.now },
}, { timestamps: true });

postSchema.index({ timestamp: -1 });
postSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Post', postSchema);
