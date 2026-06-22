const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { getIO } = require('../socket/socket');
const { createNotification } = require('../services/notificationService');

exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id || req.user._id;

    let friendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (friendship) {
      if (friendship.status === 'rejected') {
        // Reuse the document but swap requester/recipient if needed, and set to pending
        friendship.requester = requesterId;
        friendship.recipient = recipientId;
        friendship.status = 'pending';
      } else {
        return res.status(400).json({ message: 'Friendship request already exists or you are already friends.' });
      }
    } else {
      friendship = new Friendship({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
      });
    }

    await friendship.save();

    const requester = await User.findById(requesterId).select('name avatar');

    try {
      const io = getIO();
      io.to(recipientId.toString()).emit('friend:request', {
        friendship,
        requester: {
          name: requester.name,
          avatar: requester.avatar
        }
      });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    try {
      await createNotification(
        recipientId,
        'FRIEND_REQUEST',
        'New Friend Request',
        `${requester.name} sent you a friend request.`
      );
    } catch (err) {
      console.error('Notification creation failed', err);
    }

    res.status(201).json(friendship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.user.id || req.user._id;

    const friendship = await Friendship.findById(id);
    if (!friendship) return res.status(404).json({ message: 'Not found' });

    if (friendship.recipient.toString() !== recipientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    try {
      const io = getIO();
      io.to(friendship.requester.toString()).emit('friend:accepted', friendship);
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.json(friendship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.user.id || req.user._id;

    const friendship = await Friendship.findById(id);
    if (!friendship) return res.status(404).json({ message: 'Not found' });

    if (friendship.recipient.toString() !== recipientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    friendship.status = 'rejected';
    await friendship.save();

    res.json(friendship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }]
    }).populate('requester', 'name username avatar').populate('recipient', 'name username avatar');

    res.json(friendships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const requests = await Friendship.find({
      status: 'pending',
      recipient: userId
    }).populate('requester', 'name username avatar');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id || req.user._id;

    // We delete the friendship completely when unfriended
    const friendship = await Friendship.findOneAndDelete({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.json({ success: true, message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id || req.user._id;

    let friendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (!friendship) {
      friendship = new Friendship({ requester: userId, recipient: friendId });
    }
    
    // Using requester as the one who blocked
    friendship.requester = userId;
    friendship.recipient = friendId;
    friendship.status = 'blocked';
    await friendship.save();

    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id || req.user._id;

    const friendship = await Friendship.findOne({
      requester: userId,
      recipient: friendId,
      status: 'blocked'
    });

    if (friendship) {
      await Friendship.findByIdAndDelete(friendship._id);
    }

    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id || req.user._id;

    const friendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (!friendship) {
      return res.json({ status: 'none' });
    }

    res.json({ status: friendship.status, requester: friendship.requester });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
