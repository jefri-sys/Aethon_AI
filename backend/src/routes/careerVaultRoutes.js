const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { verifyVaultAccess } = require('../middleware/verifyVaultAccess');
const { uploadCareerDocument } = require('../middleware/careerVaultUpload');
const careerVaultController = require('../controllers/careerVaultController');
const resumeController = require('../controllers/resumeController');
const { uploadResumeDocument } = require('../middleware/resumeUpload');
const jobDescriptionController = require('../controllers/jobDescriptionController');
const { uploadJobDescriptionDocument } = require('../middleware/jobDescriptionUpload');

// Public routes
router.post('/reset-vault-password', careerVaultController.resetVaultPassword);

// Protected routes
router.use(verifyToken);

router.post('/forgot-password', careerVaultController.forgotPassword);
router.post('/verify-access', careerVaultController.verifyAccess);
router.post('/setup-password', careerVaultController.setupPassword);

router.post('/upload', uploadCareerDocument, verifyVaultAccess, careerVaultController.uploadDocument);

// Resume Routes (Must be before /:id)
router.post('/resumes', verifyVaultAccess, resumeController.createResume);
router.post('/resumes/upload', verifyVaultAccess, uploadResumeDocument, resumeController.uploadResume);
router.get('/resumes', verifyVaultAccess, resumeController.listResumes);
router.get('/resumes/:id', verifyVaultAccess, resumeController.getResume);
router.put('/resumes/:id', verifyVaultAccess, resumeController.updateResume);
router.post('/resumes/:id/regenerate', verifyVaultAccess, resumeController.regenerateResume);
router.get('/resumes/:id/preview', verifyVaultAccess, resumeController.previewResumeHTML);
router.put('/resumes/:id/template', verifyVaultAccess, resumeController.updateResumeTemplate);
router.post('/resumes/:id/export', verifyVaultAccess, resumeController.exportResumePdf);
router.post('/resumes/:id/analyze', verifyVaultAccess, resumeController.analyzeResume);
router.post('/resumes/:id/recruiter-analysis', verifyVaultAccess, resumeController.runRecruiterAnalysis);
router.post('/resumes/:id/rewrite-suggestions', verifyVaultAccess, resumeController.generateRewriteSuggestionsController);
router.post('/resumes/:id/apply-rewrite', verifyVaultAccess, resumeController.applyRewriteController);
router.post('/resumes/:id/simulate-review', verifyVaultAccess, resumeController.simulateReviewController);
router.delete('/resumes/:id', verifyVaultAccess, resumeController.deleteResume);

// Job Description Routes
router.post('/job-descriptions', verifyVaultAccess, uploadJobDescriptionDocument, jobDescriptionController.createJobDescription);
router.get('/job-descriptions', verifyVaultAccess, jobDescriptionController.getJobDescriptions);
router.get('/job-descriptions/:id', verifyVaultAccess, jobDescriptionController.getJobDescription);
router.delete('/job-descriptions/:id', verifyVaultAccess, jobDescriptionController.deleteJobDescription);

router.get('/timeline', verifyVaultAccess, careerVaultController.getTimeline);
router.get('/', verifyVaultAccess, careerVaultController.getDocuments);
router.get('/:id', verifyVaultAccess, careerVaultController.getDocument);
router.put('/:id', verifyVaultAccess, careerVaultController.updateDocument);
router.delete('/:id', verifyVaultAccess, careerVaultController.deleteDocument);

module.exports = router;
