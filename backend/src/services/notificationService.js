const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../socket/socket');

const createNotification = async (userId, type, title, message) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Check if user has explicitly turned off this notification type
    if (user.notificationPreferences && user.notificationPreferences.get(type) === false) {
      return null;
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      read: false
    });
    await notification.save();
    
    try {
      const io = getIO();
      if (io) {
        io.to(userId.toString()).emit("newNotification", notification);
      }
    } catch (e) {
      console.log("Socket not initialized or error emitting:", e.message);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};
