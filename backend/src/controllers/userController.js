const User = require('../models/User');
const Message = require('../models/Message');
const GroupMessage = require('../models/GroupMessage');
const Conversation = require('../models/Conversation');
const StudyGroup = require('../models/StudyGroup');
const Friendship = require('../models/Friendship');

const buildUserResponse = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
  college: user.college,
  course: user.course,
  semester: user.semester,
  targetCGPA: user.targetCGPA,
  monthlyBudget: user.monthlyBudget,
  onboardingDone: user.onboardingDone,
  theme: user.theme,
  emailVerified: user.emailVerified,
});

const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const { targetCGPA, monthlyBudget, onboardingDone } = req.body;

    if (targetCGPA !== undefined) {
      const parsedTargetCGPA = Number(targetCGPA);

      if (
        Number.isNaN(parsedTargetCGPA) ||
        parsedTargetCGPA < 6 ||
        parsedTargetCGPA > 10
      ) {
        return res.status(400).json({
          success: false,
          message: 'Target CGPA must be between 6.0 and 10.0',
        });
      }

      updates.targetCGPA = parsedTargetCGPA;
    }

    if (monthlyBudget !== undefined) {
      const parsedMonthlyBudget = Number(monthlyBudget);

      if (Number.isNaN(parsedMonthlyBudget) || parsedMonthlyBudget < 0) {
        return res.status(400).json({
          success: false,
          message: 'Monthly budget must be a positive number',
        });
      }

      updates.monthlyBudget = parsedMonthlyBudget;
    }

    if (onboardingDone !== undefined) {
      updates.onboardingDone = Boolean(onboardingDone);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update profile',
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: regex },
        { username: regex }
      ]
    }).select('name username avatar department year');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Get user's conversations
    const convos = await Conversation.find({ participants: userId }).select('_id');
    const convoIds = convos.map(c => c._id);

    const unreadDMs = await Message.countDocuments({
      conversationId: { $in: convoIds },
      senderId: { $ne: userId },
      seenBy: { $ne: userId }
    });

    // Get user's groups
    const groups = await StudyGroup.find({ 'members.userId': userId }).select('_id');
    const groupIds = groups.map(g => g._id);

    const unreadGroups = await GroupMessage.countDocuments({
      groupId: { $in: groupIds },
      senderId: { $ne: userId },
      readBy: { $ne: userId }
    });

    const pendingRequests = await Friendship.countDocuments({
      status: 'pending',
      recipient: userId
    });

    res.json({ count: unreadDMs + unreadGroups + pendingRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUnreadMessagesCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const convos = await Conversation.find({ participants: userId }).select('_id');
    const convoIds = convos.map(c => c._id);
    const unreadDMs = await Message.countDocuments({
      conversationId: { $in: convoIds },
      senderId: { $ne: userId },
      seenBy: { $ne: userId }
    });

    const groups = await StudyGroup.find({ 'members.userId': userId }).select('_id');
    const groupIds = groups.map(g => g._id);
    const unreadGroups = await GroupMessage.countDocuments({
      groupId: { $in: groupIds },
      senderId: { $ne: userId },
      readBy: { $ne: userId }
    });

    res.json({ count: unreadDMs + unreadGroups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  updateProfile,
  searchUsers,
  getUnreadCount,
  getUnreadMessagesCount
};
