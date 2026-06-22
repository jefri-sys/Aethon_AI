const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Missed'],
    default: 'Pending'
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  topics: [{
    type: String
  }],
  coveredTopics: [{
    type: String
  }],
  scheduledDate: {
    type: Date
  },
  priorityScore: {
    type: Number
  },
  pinnedByUser: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['ai_planner', 'manual', 'custom_pdf_plan'],
    default: 'manual'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyTask', studyTaskSchema);
