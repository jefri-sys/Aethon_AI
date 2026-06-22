const mongoose = require('mongoose');

const explorerSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  roadmap: {
    type: mongoose.Schema.Types.Mixed
  },
  resources: [{
    title: String,
    url: String,
    type: { type: String },
    estimatedTime: String,
    fromInitialSearch: { type: Boolean, default: false }
  }],
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    searchPerformed: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

explorerSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ExplorerSession', explorerSessionSchema);
