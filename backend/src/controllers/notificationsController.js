const Notification = require('../models/Notification');
const User = require('../models/User');

const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const user = await User.findById(req.user.id);
    const disabledTypes = [];
    if (user?.notificationPreferences) {
      for (const [key, val] of user.notificationPreferences.entries()) {
        if (val === false) disabledTypes.push(key);
      }
    }
    
    const query = { userId: req.user.id };
    if (disabledTypes.length > 0) {
      query.type = { $nin: disabledTypes };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
      
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id);
    const disabledTypes = [];
    if (user?.notificationPreferences) {
      for (const [key, val] of user.notificationPreferences.entries()) {
        if (val === false) disabledTypes.push(key);
      }
    }
    
    const query = { userId: req.user.id };
    if (disabledTypes.length > 0) {
      query.type = { $nin: disabledTypes };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);

    res.json({ success: true, notifications, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
