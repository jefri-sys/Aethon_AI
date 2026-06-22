const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'EXAM_ALERT',
      'ASSIGNMENT_DUE',
      'BUDGET_WARNING',
      'ATTENDANCE_WARNING',
      'HABIT_REMINDER',
      'STREAK_ALERT',
      'GROUP_MESSAGE',
      'NEW_MESSAGE',
      'MISSED_CALL',
      'CALENDAR_REMINDER',
      'AI_BRIEFING',
      'WEEKLY_REPORT',
      'FRIEND_REQUEST',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
