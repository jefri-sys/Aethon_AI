const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const {
  uploadNotebook,
  getNotebooks,
  getNotebook,
  deleteNotebook,
  askQuestion,
  generateSummary,
  generateQuiz,
  submitQuiz,
  getIndexStatus,
  saveSummaryAsPdf,
  getSavedSummaries,
  deleteSavedSummary
} = require('../controllers/notebookController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed!'), false);
    }
  }
});

router.use(verifyToken);

router.post('/notebooks/upload', upload.single('file'), uploadNotebook);
router.get('/notebooks', getNotebooks);
router.get('/notebooks/:id', getNotebook);
router.get('/notebooks/:id/index-status', getIndexStatus);
router.delete('/notebooks/:id', deleteNotebook);
router.post('/notebooks/:id/question', askQuestion);
router.post('/notebooks/:id/summary', generateSummary);
router.post('/notebooks/:id/quiz', generateQuiz);
router.post('/notebooks/:id/submit-quiz', submitQuiz);

router.post('/notebooks/:id/summaries', saveSummaryAsPdf);
router.get('/notebooks/:id/summaries', getSavedSummaries);
router.delete('/summaries/:summaryId', deleteSavedSummary);

module.exports = router;
