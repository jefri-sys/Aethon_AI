const express = require('express');
const router = express.Router({ mergeParams: true }); // to access :semesterId from parent router if needed
const timetableController = require('../controllers/timetableController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/semesters/:semesterId/timetable', timetableController.getTimetable);
router.post('/semesters/:semesterId/timetable', timetableController.addTimetableSlot);
router.post('/semesters/:semesterId/timetable/bulk', timetableController.saveTimetable);
router.delete('/timetable/:id', timetableController.deleteTimetableSlot);

module.exports = router;
