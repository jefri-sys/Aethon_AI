const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  rawText: {
    type: String,
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['pasted', 'uploaded'],
    required: true,
  },
  originalFileUrl: {
    type: String,
  },
  cloudinaryPublicId: {
    type: String,
  },
  extractedKeywords: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

jobDescriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
