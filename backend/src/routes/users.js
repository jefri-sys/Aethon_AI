const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  updatePassword, 
  updateBudget, 
  updateNotificationPreferences, 
  resetData,
  deleteAccount, 
  searchUsers,
  getUnreadCount
} = require('../controllers/usersController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/search', verifyToken, searchUsers);
router.get('/profile', verifyToken, getProfile);
router.get('/unread-count', verifyToken, getUnreadCount);
router.patch('/profile', verifyToken, updateProfile);
router.patch('/password', verifyToken, updatePassword);
router.patch('/budget', verifyToken, updateBudget);
router.patch('/notification-preferences', verifyToken, updateNotificationPreferences);
router.post('/reset-data', verifyToken, resetData);
router.delete('/account', verifyToken, deleteAccount);

module.exports = router;
