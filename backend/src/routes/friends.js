const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/request', friendsController.sendRequest);
router.patch('/request/:id/accept', friendsController.acceptRequest);
router.patch('/request/:id/reject', friendsController.rejectRequest);
router.get('/', friendsController.getFriends);
router.get('/requests', friendsController.getRequests);
router.delete('/:friendId', friendsController.unfriend);
router.patch('/:friendId/block', friendsController.blockUser);
router.patch('/:friendId/unblock', friendsController.unblockUser);
router.get('/:friendId/status', friendsController.checkStatus);

module.exports = router;
