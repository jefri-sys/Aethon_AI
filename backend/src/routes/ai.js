const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { chat, getBriefing, explainMarks, getFinanceInsight } = require('../controllers/aiController');

const router = express.Router();

router.use(verifyToken);

router.post('/ai/chat', chat);
router.get('/ai/briefing', getBriefing);
router.post('/ai/explain-marks', explainMarks);
router.get('/ai/finance-insight', getFinanceInsight);

module.exports = router;
