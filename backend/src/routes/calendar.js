const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/auth');

router.get('/events', verifyToken, calendarController.getCalendarEvents);
router.post('/events', verifyToken, calendarController.createCustomEvent);
router.put('/events/:id', verifyToken, calendarController.updateCustomEvent);
router.delete('/events/:id', verifyToken, calendarController.deleteCustomEvent);

module.exports = router;
