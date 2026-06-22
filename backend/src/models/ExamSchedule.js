const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    enum: ['internal1', 'internal2', 'endSemester'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  venue: {
    type: String
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
