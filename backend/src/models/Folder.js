const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);
