const express = require('express');
const router = express.Router();
const { getTurnCredentials } = require('../controllers/callsController');
const { verifyToken } = require('../middleware/auth');

router.get('/turn-credentials', verifyToken, getTurnCredentials);

module.exports = router;
