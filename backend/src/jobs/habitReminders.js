const cron = require('node-cron');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { createNotification } = require('../services/notificationService');

const startHabitReminders = () => {
  cron.schedule('0 21 * * *', async () => {
    console.log('Running habit reminders job...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Find all users who have at least one habit
      const usersWithHabits = await Habit.distinct('userId');

      // Find users who have completed ALL their habits for today
      // Actually, we just need to remind them if they have ANY incomplete habit.
      // So if count(Habit) > count(completed HabitLog for today), they need a reminder.
      
      for (const userId of usersWithHabits) {
        const totalHabits = await Habit.countDocuments({ userId });
        const completedLogs = await HabitLog.countDocuments({
          userId,
          date: todayStr,
          completed: true
        });

        if (completedLogs < totalHabits) {
        await createNotification(
          userId,
          'HABIT_REMINDER',
          'Daily check-in pending',
          "You have habits to complete today. Keep up the streak!"
        );
        }
      }
    } catch (error) {
      console.error('Error running habit reminders job:', error);
    }
  });
};

module.exports = startHabitReminders;
