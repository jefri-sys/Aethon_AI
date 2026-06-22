const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { recordFocusSession, getFocusStats } = require('../controllers/focusController');

const router = express.Router();

router.use(verifyToken);
router.post('/focus', recordFocusSession);
router.get('/focus/stats', getFocusStats);

module.exports = router;
