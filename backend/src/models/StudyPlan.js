const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  studyTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
