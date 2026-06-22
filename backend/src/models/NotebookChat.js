const mongoose = require('mongoose');

const notebookChatSchema = new mongoose.Schema({
  notebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant']
  },
  message: {
    type: String,
    required: true
  },
  quizData: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NotebookChat', notebookChatSchema);
