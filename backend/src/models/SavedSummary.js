const mongoose = require('mongoose');

const savedSummarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summaryText: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

savedSummarySchema.index({ user: 1, notebook: 1 });
savedSummarySchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('SavedSummary', savedSummarySchema);
