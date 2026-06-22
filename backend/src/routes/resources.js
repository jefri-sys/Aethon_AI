const express = require('express');
const router = express.Router();
const { exploreResources, getHistory, getSession, chat, deleteSession } = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/auth');

router.post('/explore', verifyToken, exploreResources);
router.get('/history', verifyToken, getHistory);
router.get('/sessions/:sessionId', verifyToken, getSession);
router.post('/sessions/:sessionId/messages', verifyToken, chat);
router.delete('/sessions/:sessionId', verifyToken, deleteSession);

module.exports = router;
