const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const habitsController = require('../controllers/habitsController');

router.get('/habits', verifyToken, habitsController.getHabits);
router.post('/habits', verifyToken, habitsController.createHabit);
router.delete('/habits/:id', verifyToken, habitsController.deleteHabit);
router.patch('/habits/checkin', verifyToken, habitsController.checkinHabit);
router.get('/habits/analytics', verifyToken, habitsController.getHabitAnalytics);

module.exports = router;
