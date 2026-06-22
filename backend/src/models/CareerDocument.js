const mongoose = require("mongoose");

const careerDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["certification", "internship", "project", "research", "achievement"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    issuer: {
      type: String,
      trim: true,
    },
    dateEarned: {
      type: Date,
    },
    skillsTags: {
      type: [String],
      default: [],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image"],
      required: true,
    },
    extractedFields: {
      type: mongoose.Schema.Types.Mixed,
    },
    extractionStatus: {
      type: String,
      enum: ["success", "partial", "failed"],
      default: "success",
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
  },
  { timestamps: true }
);

// Index for efficient filtered queries
careerDocumentSchema.index({ userId: 1, category: 1 });

const CareerDocument = mongoose.model("CareerDocument", careerDocumentSchema);

module.exports = CareerDocument;
