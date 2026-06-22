const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.get('/notifications', verifyToken, notificationsController.getNotifications);
router.get('/notifications/all', verifyToken, notificationsController.getAllNotifications);
router.patch('/notifications/read-all', verifyToken, notificationsController.markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, notificationsController.markAsRead);
router.delete('/notifications/:id', verifyToken, notificationsController.deleteNotification);

module.exports = router;
