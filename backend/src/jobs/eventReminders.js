const cron = require('node-cron');
const CustomEvent = require('../models/CustomEvent');
const { createNotification } = require('../services/notificationService');

const startEventReminders = () => {
  // Run every morning at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log('Running event reminders job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We want to find events where (eventDate - today) == reminderDays
      // Since MongoDB dates can be tricky, we can fetch upcoming events and filter in memory or query range
      
      const upcomingEvents = await CustomEvent.find({
        date: { $gte: today }
      });

      for (const event of upcomingEvents) {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === event.reminderDays) {
          let message = `You have an event tomorrow: ${event.title}`;
          if (diffDays === 0) {
              message = `You have an event today: ${event.title}`;
          } else {
              message = `You have an event in ${diffDays} day(s): ${event.title}`;
          }

          await createNotification(
            event.userId,
            'EVENT_REMINDER',
            'Upcoming Event',
            message
          );
        }
      }
    } catch (error) {
      console.error('Error running event reminders job:', error);
    }
  });
};

module.exports = startEventReminders;
