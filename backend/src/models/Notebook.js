const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  title: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx']
  },
  fileUrl: {
    type: String
  },
  pageCount: {
    type: Number,
    default: 1
  },
  extractedText: {
    type: String,
    required: true
  },
  indexed: {
    type: Boolean,
    default: false
  },
  chunksCount: {
    type: Number,
    default: 0
  },
  indexedAt: {
    type: Date
  },
  chromaCollectionId: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notebook', notebookSchema);
