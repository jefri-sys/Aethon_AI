const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRole: {
      type: String,
      enum: [
        'software_development',
        'data_analytics',
        'research',
        'higher_studies',
        'internships',
        'general_placement'
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      // Structured JSON with shape:
      // {
      //   personalInfo: { name, email, phone, linkedin, github, portfolio },
      //   education: [{ institution, degree, field, startDate, endDate, cgpa, relevantCoursework: [String] }],
      //   skills: [String],
      //   projects: [{ title, description, technologies: [String], link, dateRange }],
      //   certifications: [{ title, issuer, date }],
      //   internships: [{ company, role, startDate, endDate, description }],
      //   achievements: [{ title, description, date }],
      //   research: [{ title, publication, date, description }],
      //   experience: [{ company, role, startDate, endDate, description }]
      // }
    },
    sectionOrder: {
      type: [String],
      default: [
        'personalInfo',
        'education',
        'skills',
        'projects',
        'internships',
        'experience',
        'certifications',
        'research',
        'achievements'
      ],
    },
    hiddenSections: {
      type: [String],
      default: [],
    },
    templateId: {
      type: String,
      default: 'ats_classic',
    },
    sourceSnapshot: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastGeneratedAt: {
      type: Date,
    },
    lastExportedPdfUrl: {
      type: String,
    },
    lastExportedAt: {
      type: Date,
    },
    lastAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    recruiterAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    pendingRewriteSuggestions: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    atsValidation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    hiringManagerSimulation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    origin: {
      type: String,
      enum: ['generated', 'uploaded'],
      default: 'generated',
    },
    originalFileUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient lookups
resumeSchema.index({ userId: 1, targetRole: 1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
