const express = require('express');
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', authLimiter, login);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getMe);

module.exports = router;
