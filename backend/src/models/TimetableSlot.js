const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  periodNumber: {
    type: Number
  },
  startTime: {
    type: String, // e.g., '09:00'
    required: true
  },
  endTime: {
    type: String, // e.g., '10:00'
    required: true
  },
  room: {
    type: String
  },
  teacherName: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
