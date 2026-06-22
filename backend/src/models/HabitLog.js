const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  }
});

habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
