const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
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
    assessmentType: {
      type: String,
      enum: ['Assignment', 'Internal', 'Series', 'Lab', 'Project', 'Final'],
    },
    marksObtained: {
      type: Number,
    },
    totalMarks: {
      type: Number,
    },
    grade: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Validation to ensure marksObtained <= totalMarks or grade is provided
markSchema.pre('validate', function () {
  if (this.grade) {
    // If grade is provided, marks are optional
    return;
  }
  
  if (this.marksObtained === undefined || this.marksObtained === null) {
    this.invalidate('marksObtained', 'Marks obtained is required if no grade is provided');
  }
  if (this.totalMarks === undefined || this.totalMarks === null) {
    this.invalidate('totalMarks', 'Total marks is required if no grade is provided');
  }
  if (this.marksObtained !== undefined && this.totalMarks !== undefined && this.marksObtained > this.totalMarks) {
    this.invalidate(
      'marksObtained',
      'Marks obtained cannot be greater than total marks'
    );
  }
});

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;
