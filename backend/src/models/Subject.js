const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    trim: true,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 3,
  },
  type: {
    type: String,
    enum: ['Theory', 'Lab', 'Project', 'Elective'],
  },
  professor: {
    type: String,
    trim: true,
  },
  semester: {
    type: Number,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  courseCode: {
    type: String,
    trim: true
  },
  teacherName: {
    type: String,
    trim: true
  },
  examDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
