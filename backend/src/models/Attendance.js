const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  attendedClasses: {
    type: Number,
    required: true,
    default: 0,
  },
  totalClasses: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

attendanceSchema.virtual('percentage').get(function () {
  if (this.totalClasses === 0) {
    return 0;
  }
  return (this.attendedClasses / this.totalClasses) * 100;
});

// Ensure virtual fields are serialized.
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
