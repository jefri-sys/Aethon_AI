const mongoose = require('mongoose');

const briefingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

briefingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.Briefing || mongoose.model('Briefing', briefingSchema);
