const express = require('express');
const router = express.Router({ mergeParams: true });
const examController = require('../controllers/examController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/semesters/:semesterId/exams', examController.getExams);
router.post('/semesters/:semesterId/exams', examController.addExam);
router.post('/semesters/:semesterId/exams/bulk', examController.saveExams);
router.delete('/exams/:id', examController.deleteExam);

module.exports = router;
