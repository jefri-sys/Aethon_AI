const mongoose = require('mongoose');

const customEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['birthday', 'college', 'personal', 'other'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  reminderDays: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomEvent', customEventSchema);
