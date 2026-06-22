const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
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
} = require('../controllers/subjectFileController');
const { upload } = require('../middleware/mediaUpload');

const router = express.Router({ mergeParams: true });

router.use(verifyToken);

router.get('/contents', getContents);
router.get('/folders/all', getAllFolders);

router.post('/folders', createFolder);
router.patch('/folders/:folderId', renameFolder);
router.delete('/folders/:folderId', deleteFolder);
router.patch('/folders/:folderId/move', moveFolder);

router.post('/files', upload.single('file'), uploadFile);
router.patch('/files/:fileId', renameFile);
router.delete('/files/:fileId', deleteFile);
router.patch('/files/:fileId/move', moveFile);

module.exports = router;
