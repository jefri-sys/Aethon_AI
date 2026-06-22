const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true // e.g., '2025-2026'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);
