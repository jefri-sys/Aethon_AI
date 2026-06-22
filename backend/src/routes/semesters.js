const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', semesterController.getSemesters);
router.post('/', semesterController.createSemester);
router.put('/:id', semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);
router.patch('/:id/complete', semesterController.markComplete);

module.exports = router;
