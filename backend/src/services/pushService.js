const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const DEEP_LINK_MAP = {
  EXAM_ALERT: '/calendar',
  ASSIGNMENT_DUE: '/calendar',
  BUDGET_WARNING: '/finance',
  ATTENDANCE_WARNING: '/academics',
  HABIT_REMINDER: '/habits',
  STREAK_ALERT: '/habits',
  GROUP_MESSAGE: '/groups',
  NEW_MESSAGE: '/messages',
  MISSED_CALL: '/messages',
  CALENDAR_REMINDER: '/calendar',
  AI_BRIEFING: '/dashboard',
  WEEKLY_REPORT: '/dashboard',
  FRIEND_REQUEST: '/messages'
};

const SOCKET_SUPPRESSED_TYPES = ['GROUP_MESSAGE', 'NEW_MESSAGE', 'MISSED_CALL', 'FRIEND_REQUEST'];

const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    
    const stringifiedPayload = JSON.stringify(payload);
    
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, stringifiedPayload);
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Subscription expired or invalid. Deleting...', subscription._id);
            await PushSubscription.findByIdAndDelete(subscription._id);
          } else {
            console.error('Push send error:', error);
          }
        }
      })
    );
  } catch (error) {
    console.error('Error fetching subscriptions for push:', error);
  }
};

module.exports = {
  sendPushToUser,
  DEEP_LINK_MAP,
  SOCKET_SUPPRESSED_TYPES
};
