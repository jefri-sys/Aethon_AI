const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});
const {
  createSubject,
  bulkCreateSubjects,
  getSubjects,
  updateSubject,
  deleteSubject,
  addMark,
  getMarks,
  deleteMark,
  updateAttendance,
  getAttendance,
  getCGPA,
  postWhatIf,
  getReadiness,
  importGradeCard,
  confirmImport,
  importTimetable,
  importExamSchedule,
  migrateSubjects
} = require('../controllers/academicsController');
const { extractCourses } = require('../controllers/aiController');
const subjectFilesRoutes = require('./subjectFiles');

const router = express.Router();

router.use(verifyToken);

// Subjects
router.post('/subjects', createSubject);
router.post('/courses/bulk', bulkCreateSubjects);
router.get('/subjects', getSubjects);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/subjects/migrate', migrateSubjects);

// Subject Storage
router.use('/subjects/:subjectId/storage', subjectFilesRoutes);

// Grade Card Import
router.post('/subjects/import-grade-card', upload.single('file'), importGradeCard);
router.post('/subjects/confirm-import', confirmImport);

// Timetable Import
router.post('/timetable/import', upload.single('file'), importTimetable);

// Exam Schedule Import
router.post('/exams/import', upload.single('file'), importExamSchedule);

// AI
router.post('/ai/extract-courses', extractCourses);

// Marks
router.post('/marks', addMark);
router.get('/marks', getMarks);
router.delete('/marks/:id', deleteMark);

// Attendance
router.patch('/attendance/:subjectId', updateAttendance);
router.get('/attendance', getAttendance);

// CGPA
router.get('/academics/cgpa', getCGPA);
router.post('/academics/what-if', postWhatIf);
router.get('/academics/readiness/:subjectId', getReadiness);

module.exports = router;
