const SubjectFile = require('../models/SubjectFile');
const Folder = require('../models/Folder');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper to delete folder recursively
const deleteFolderRecursively = async (folderId, userId) => {
  const childFolders = await Folder.find({ parentFolderId: folderId, userId });
  for (const child of childFolders) {
    await deleteFolderRecursively(child._id, userId);
  }

  const files = await SubjectFile.find({ folderId: folderId, userId });
  for (const file of files) {
    if (file.publicId) {
      await cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType });
    }
    await SubjectFile.findByIdAndDelete(file._id);
  }

  await Folder.findByIdAndDelete(folderId);
};

const getContents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    let folderId = req.query.folderId;
    if (folderId === 'null') folderId = null;

    const folders = await Folder.find({ subjectId, userId: req.user.id, parentFolderId: folderId || null }).sort({ name: 1 });
    const files = await SubjectFile.find({ subjectId, userId: req.user.id, folderId: folderId || null }).sort({ fileName: 1 });

    res.json({ success: true, folders, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ subjectId: req.params.subjectId, userId: req.user.id }).sort({ name: 1 });
    res.json({ success: true, folders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    const { subjectId } = req.params;
    
    const newFolder = await Folder.create({
      subjectId,
      userId: req.user.id,
      name,
      parentFolderId: parentFolderId === 'null' ? null : (parentFolderId || null)
    });
    
    res.status(201).json({ success: true, folder: newFolder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.folderId, userId: req.user.id },
      { name },
      { new: true }
    );
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    res.json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const renameFile = async (req, res) => {
  try {
    const { name } = req.body;
    const file = await SubjectFile.findOneAndUpdate(
      { _id: req.params.fileId, userId: req.user.id },
      { originalName: name, fileName: name },
      { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const folder = await Folder.findOne({ _id: folderId, userId: req.user.id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    
    await deleteFolderRecursively(folderId, req.user.id);
    res.json({ success: true, message: 'Folder deleted recursively' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const moveFile = async (req, res) => {
  try {
    const { folderId } = req.body;
    const file = await SubjectFile.findOneAndUpdate(
      { _id: req.params.fileId, userId: req.user.id },
      { folderId: folderId === 'null' ? null : (folderId || null) },
      { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const isDescendant = async (sourceId, targetId) => {
  if (!targetId) return false;
  let current = await Folder.findById(targetId);
  while (current && current.parentFolderId) {
    if (current.parentFolderId.toString() === sourceId.toString()) return true;
    current = await Folder.findById(current.parentFolderId);
  }
  return false;
};

const moveFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    let { parentFolderId } = req.body;
    parentFolderId = parentFolderId === 'null' ? null : (parentFolderId || null);

    if (parentFolderId && parentFolderId.toString() === folderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
    }
    if (parentFolderId && await isDescendant(folderId, parentFolderId)) {
      return res.status(400).json({ success: false, message: 'Cannot move folder into its own descendant' });
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: folderId, userId: req.user.id },
      { parentFolderId },
      { new: true }
    );
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    res.json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    let folderId = req.query.folderId || req.body.folderId;
    if (folderId === 'null' || folderId === 'undefined') folderId = null;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `synapse/subjects/${req.params.subjectId}`,
        resource_type: 'auto'
      },
      async (error, result) => {
        if (error) return res.status(500).json({ success: false, message: error.message });

        const newFile = await SubjectFile.create({
          subjectId: req.params.subjectId,
          userId: req.user.id,
          folderId: folderId || null,
          fileName: result.original_filename || req.file.originalname,
          originalName: req.file.originalname,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          resourceType: result.resource_type
        });

        res.status(201).json({ success: true, file: newFile });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await SubjectFile.findOne({ _id: req.params.fileId, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    await cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType });
    await SubjectFile.findByIdAndDelete(req.params.fileId);

    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getContents, 
  getAllFolders,
  createFolder, 
  renameFolder, 
  renameFile, 
  deleteFolder, 
  moveFile, 
  moveFolder, 
  uploadFile, 
  deleteFile 
};
