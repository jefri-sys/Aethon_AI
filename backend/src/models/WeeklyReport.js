const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStartDate: {
    type: String,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  content: {
    type: String,
    required: true,
  },
  studyHours: {
    type: Number,
  },
  tasksCompleted: {
    type: Number,
  },
  tasksMissed: {
    type: Number,
  },
  totalSpent: {
    type: Number,
  },
  habitsCompleted: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.WeeklyReport ||
  mongoose.model('WeeklyReport', weeklyReportSchema);
