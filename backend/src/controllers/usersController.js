const User = require('../models/User');
const Budget = require('../models/Budget');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const Attendance = require('../models/Attendance');
const StudyTask = require('../models/StudyTask');
const FocusSession = require('../models/FocusSession');
const Notebook = require('../models/Notebook');
const NotebookChat = require('../models/NotebookChat');
const Expense = require('../models/Expense');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const Notification = require('../models/Notification');
const Briefing = require('../models/Briefing');
const WeeklyReport = require('../models/WeeklyReport');
const StudyGroup = require('../models/StudyGroup');
const SavedSummary = require('../models/SavedSummary');
const ExplorerSession = require('../models/ExplorerSession');
const Message = require('../models/Message');
const GroupMessage = require('../models/GroupMessage');
const Conversation = require('../models/Conversation');
const Semester = require('../models/Semester');
const TimetableSlot = require('../models/TimetableSlot');
const ExamSchedule = require('../models/ExamSchedule');
const CustomEvent = require('../models/CustomEvent');
const SubjectFile = require('../models/SubjectFile');
const Folder = require('../models/Folder');
const Friendship = require('../models/Friendship');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, college, course, semester, targetCGPA, universityType, theme, avatar, monthlyBudget, onboardingDone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (college) updates.college = college;
    if (course) updates.course = course;
    if (semester) updates.semester = Number(semester);
    if (targetCGPA) updates.targetCGPA = Number(targetCGPA);
    if (universityType) updates.universityType = universityType;
    if (theme) updates.theme = theme;
    if (avatar !== undefined) updates.avatar = avatar;
    if (monthlyBudget !== undefined) updates.monthlyBudget = Number(monthlyBudget);
    if (onboardingDone !== undefined) updates.onboardingDone = Boolean(onboardingDone);

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-passwordHash');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid current password' });

    // Validate newPassword: min 8 chars, 1 uppercase, 1 number
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and contain at least 1 uppercase letter and 1 number' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { totalBudget, categories } = req.body; // food, transport, etc.
    let budget = await Budget.findOne({ userId: req.user.id, month: null });
    
    const updates = {};
    if (totalBudget !== undefined) updates.totalBudget = Number(totalBudget);
    if (categories) {
      if (categories.food !== undefined) updates.food = Number(categories.food);
      if (categories.transport !== undefined) updates.transport = Number(categories.transport);
      if (categories.books !== undefined) updates.books = Number(categories.books);
      if (categories.entertainment !== undefined) updates.entertainment = Number(categories.entertainment);
      if (categories.hostel !== undefined) updates.hostel = Number(categories.hostel);
      if (categories.miscellaneous !== undefined) updates.miscellaneous = Number(categories.miscellaneous);
    }

    if (!budget) {
      budget = new Budget({ userId: req.user.id, month: null, ...updates });
      await budget.save();
    } else {
      budget = await Budget.findOneAndUpdate(
        { userId: req.user.id, month: null },
        { $set: updates },
        { new: true }
      );
    }
    
    // Also update monthlyBudget in user model if totalBudget is provided
    if (totalBudget !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { monthlyBudget: Number(totalBudget) });
    }

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const { preferences } = req.body; // e.g., { EXAM_ALERT: true, HABIT_REMINDER: false }
    const user = await User.findById(req.user.id);
    
    if (!user.notificationPreferences) {
      user.notificationPreferences = new Map();
    }
    
    for (const [key, value] of Object.entries(preferences)) {
      user.notificationPreferences.set(key, Boolean(value));
    }
    
    await user.save();
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetData = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid password' });

    await Promise.all([
      Subject.deleteMany({ userId }),
      Mark.deleteMany({ userId }),
      Attendance.deleteMany({ userId }),
      StudyTask.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      Notebook.deleteMany({ userId }),
      NotebookChat.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      HabitLog.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Briefing.deleteMany({ userId }),
      WeeklyReport.deleteMany({ userId }),
      SavedSummary.deleteMany({ user: userId }),
      ExplorerSession.deleteMany({ user: userId }),
      Semester.deleteMany({ userId }),
      TimetableSlot.deleteMany({ userId }),
      ExamSchedule.deleteMany({ userId }),
      CustomEvent.deleteMany({ userId }),
      SubjectFile.deleteMany({ userId }),
      Folder.deleteMany({ userId }),
      StudyGroup.updateMany({ "members.userId": userId }, { $pull: { members: { userId: userId } } })
    ]);

    res.status(200).json({ success: true, message: 'Data reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid password' });

    await Promise.all([
      Subject.deleteMany({ userId }),
      Mark.deleteMany({ userId }),
      Attendance.deleteMany({ userId }),
      StudyTask.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      Notebook.deleteMany({ userId }),
      NotebookChat.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      HabitLog.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Briefing.deleteMany({ userId }),
      WeeklyReport.deleteMany({ userId }),
      SavedSummary.deleteMany({ user: userId }),
      ExplorerSession.deleteMany({ user: userId }),
      Semester.deleteMany({ userId }),
      TimetableSlot.deleteMany({ userId }),
      ExamSchedule.deleteMany({ userId }),
      CustomEvent.deleteMany({ userId }),
      SubjectFile.deleteMany({ userId }),
      Folder.deleteMany({ userId }),
      Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
      StudyGroup.updateMany({ "members.userId": userId }, { $pull: { members: { userId: userId } } }),
      User.findByIdAndDelete(userId)
    ]);

    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    const pendingRequests = await Friendship.countDocuments({
      status: 'pending',
      recipient: userId
    });

    res.json({ count: unreadDMs + unreadGroups + pendingRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  updateBudget,
  updateNotificationPreferences,
  resetData,
  deleteAccount,
  searchUsers,
  getUnreadCount
};
