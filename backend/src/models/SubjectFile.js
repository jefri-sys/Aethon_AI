const mongoose = require('mongoose');

const subjectFileSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    resourceType: { type: String, required: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubjectFile', subjectFileSchema);
