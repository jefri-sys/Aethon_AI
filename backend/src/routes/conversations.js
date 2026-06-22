const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/auth');
const { upload } = require('../middleware/mediaUpload');

router.use(verifyToken);

router.post('/group', conversationController.createGroup);
router.post('/dm', conversationController.createDM);
router.get('/', conversationController.getConversations);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', conversationController.createMessage);
router.post('/:id/read', conversationController.markAsRead);
router.post('/:id/messages/media', upload.single('file'), conversationController.createMediaMessage);
router.patch('/group/:id', conversationController.updateGroup);
router.delete('/group/:id/leave', conversationController.leaveGroup);
router.delete('/dm/:id', conversationController.deleteDM);
router.delete('/:id/clear', conversationController.clearChat);
router.delete('/messages/:messageId', conversationController.deleteMessage);

module.exports = router;
