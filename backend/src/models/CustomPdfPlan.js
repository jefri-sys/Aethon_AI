const mongoose = require('mongoose');

const customPdfPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  pdfFileNames: [{ type: String }],
  extractedText: { type: String },
  topics: [
    {
      module: { type: String, required: true },
      title: { type: String, required: true },
      estimatedHours: { type: Number, default: 1 },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    }
  ],
  constraints: {
    startDate: Date,
    endDate: Date,
    dailyHours: Number,
    sessionStyle: { type: String, enum: ['focused', 'mixed'], default: 'mixed' }
  },
  generatedPlan: [
    {
      date: Date,
      tasks: [
        {
          module: String,
          topicTitle: String,
          durationMinutes: Number,
          notes: String,
          sessionNumber: Number,
          totalSessions: Number
        }
      ]
    }
  ],
  studyTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomPdfPlan', customPdfPlanSchema);
