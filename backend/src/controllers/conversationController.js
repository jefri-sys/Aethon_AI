const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const mongoose = require('mongoose');
const { getIO } = require('../socket/socket');
const { uploadToCloudinary } = require('../middleware/mediaUpload');
const { createNotification } = require('../services/notificationService');

exports.createGroup = async (req, res) => {
  try {
    const { groupName, memberIds, groupAvatar } = req.body;
    const userId = req.user.id || req.user._id;

    const participants = [userId, ...memberIds];

    const conversation = new Conversation({
      type: 'group',
      groupName,
      groupAvatar,
      participants
    });

    await conversation.save();
    await conversation.populate('participants', 'name username avatar');

    try {
      const io = getIO();
      // Emit to each member's personal room
      participants.forEach(memberId => {
        io.to(memberId.toString()).emit('group:created', conversation);
      });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const conversations = await Conversation.find({ 
      participants: userId,
      deletedFor: { $ne: userId }
    })
      .populate('participants', 'name username avatar')
      .populate({
        path: 'lastMessage',
        select: 'content type senderId'
      })
      .sort({ updatedAt: -1 })
      .lean();

    if (conversations.length > 0) {
      const conversationIds = conversations.map(c => c._id);
      
      let objectIdUserId;
      try {
        objectIdUserId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        objectIdUserId = userId; // fallback in case it's not a valid object id string
      }

      const unreadCounts = await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            senderId: { $ne: objectIdUserId },
            seenBy: { $ne: objectIdUserId }
          }
        },
        {
          $group: {
            _id: "$conversationId",
            count: { $sum: 1 }
          }
        }
      ]);

      const unreadMap = {};
      unreadCounts.forEach(item => {
        if (item._id) {
          unreadMap[item._id.toString()] = item.count;
        }
      });

      conversations.forEach(conv => {
        conv.unreadCount = unreadMap[conv._id.toString()] || 0;
      });
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    await Message.updateMany(
      { conversationId: id, senderId: { $ne: userId }, seenBy: { $ne: userId } },
      { $addToSet: { seenBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 30 } = req.query;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar')
      .populate('replyTo', 'content senderId');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { id } = req.params; // conversationId
    const { content, type = 'text', replyTo } = req.body;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (conversation.type === 'dm') {
      const friendId = conversation.participants.find(p => p.toString() !== userId.toString());
      const isFriend = await Friendship.exists({
        status: 'accepted',
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId }
        ]
      });
      if (!isFriend) {
        return res.status(403).json({ message: 'you were blocked' });
      }
    }

    const message = new Message({
      conversationId: id,
      senderId: userId,
      type,
      content,
      replyTo
    });

    await message.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('senderId', 'name avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content senderId');
    }

    try {
      const io = getIO();
      // Emitting to conversation room
      io.to(id.toString()).emit('message:receive', message);
      
      // Emit to participants' personal rooms
      conversation.participants.forEach(async p => {
        if (p.toString() !== userId.toString()) {
          io.to(p.toString()).emit('message:receive', message);

          try {
            if (type === 'call' && content.includes('Missed')) {
              await createNotification(
                p,
                'MISSED_CALL',
                'Missed Call',
                `You missed a call from ${message.senderId.name}`
              );
            } else if (type !== 'call') {
              await createNotification(
                p,
                'NEW_MESSAGE',
                `New Message from ${message.senderId.name}`,
                `${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
              );
            }
          } catch (err) {
            console.error('Failed to create notification', err);
          }
        }
      });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, groupAvatar } = req.body;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findOne({ _id: id, type: 'group' });
    if (!conversation) return res.status(404).json({ message: 'Group not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (groupName !== undefined) conversation.groupName = groupName;
    if (groupAvatar !== undefined) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    try {
      const io = getIO();
      io.to(id.toString()).emit('group:updated', conversation);
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findOne({ _id: id, type: 'group' });
    if (!conversation) return res.status(404).json({ message: 'Group not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    conversation.participants = conversation.participants.filter(p => p.toString() !== userId.toString());

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(id);
      await Message.deleteMany({ conversationId: id });
    } else {
      await conversation.save();
      try {
        const io = getIO();
        io.to(id.toString()).emit('group:memberLeft', { userId, conversationId: id });
      } catch (err) {
        console.error('Socket emit failed', err);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDM = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id || req.user._id;

    const friendship = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (!friendship) {
      return res.status(403).json({ message: 'Must be friends to send DM' });
    }

    const existingConversation = await Conversation.findOne({
      type: 'dm',
      participants: { $all: [userId, friendId] }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const conversation = new Conversation({
      type: 'dm',
      participants: [userId, friendId]
    });

    await conversation.save();
    await conversation.populate('participants', 'name username avatar');

    try {
      const io = getIO();
      [userId, friendId].forEach(id => {
        io.to(id.toString()).emit('dm:created', conversation);
      });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDM = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findOne({ _id: id, type: 'dm' });
    if (!conversation) return res.status(404).json({ message: 'DM not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!conversation.deletedFor.includes(userId)) {
      conversation.deletedFor.push(userId);
      await conversation.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMediaMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyTo } = req.body;
    const userId = req.user.id || req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (conversation.type === 'dm') {
      const friendId = conversation.participants.find(p => p.toString() !== userId.toString());
      const isFriend = await Friendship.exists({
        status: 'accepted',
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId }
        ]
      });
      if (!isFriend) {
        return res.status(403).json({ message: 'you were blocked' });
      }
    }

    const mimetype = req.file.mimetype;
    let type = 'document';
    let folderBase = conversation.type === 'dm' ? 'synapse/dm' : 'synapse/groups';
    let folderEnd = 'docs';

    if (mimetype.startsWith('image/')) {
      type = 'image';
      folderEnd = 'images';
    } else if (mimetype.startsWith('video/')) {
      type = 'video';
      folderEnd = 'videos';
    } else if (mimetype.startsWith('audio/')) {
      type = 'audio';
      folderEnd = 'audio';
    }

    const folder = `${folderBase}/${folderEnd}`;

    const url = await uploadToCloudinary(req.file.buffer, mimetype, folder);

    const message = new Message({
      conversationId: id,
      senderId: userId,
      type,
      content: url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      replyTo: replyTo || undefined
    });

    await message.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('senderId', 'name avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content senderId');
    }

    try {
      const io = getIO();
      io.to(id.toString()).emit('message:receive', message);

      // Emit to participants' personal rooms
      conversation.participants.forEach(async p => {
        if (p.toString() !== userId.toString()) {
          io.to(p.toString()).emit('message:receive', message);

          try {
            await createNotification(
              p,
              'NEW_MESSAGE',
              `New Media from ${message.senderId.name}`,
              `Sent a ${type}`
            );
          } catch (err) {
            console.error('Failed to create notification', err);
          }
        }
      });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Message.deleteMany({ conversationId: id });
    res.json({ success: true, message: 'Chat cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  // Placeholder since it was missing
  res.json({ message: 'Left group' });
};

exports.deleteDM = async (req, res) => {
  // Placeholder since it was missing
  res.json({ message: 'DM deleted' });
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id || req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Only allow the sender to delete their own message
    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    // Emit socket event to update the message on clients
    try {
      const io = getIO();
      io.to(message.conversationId.toString()).emit('message:deleted', { messageId });
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
