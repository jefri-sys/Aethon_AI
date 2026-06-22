const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    res.json({ success: true, habits });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createHabit = async (req, res) => {
  try {
    const { name, targetFrequency } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Habit name is required' });
    }

    const currentCount = await Habit.countDocuments({ userId: req.user.id });
    if (currentCount >= 6) {
      return res.status(400).json({ success: false, message: 'Maximum of 6 habits allowed' });
    }

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      targetFrequency: targetFrequency || 'daily'
    });

    res.status(201).json({ success: true, habit });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    await HabitLog.deleteMany({ habitId: habit._id });
    await Habit.findByIdAndDelete(habit._id);

    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkinHabit = async (req, res) => {
  try {
    const { habitId, completed, date } = req.body; // date format: YYYY-MM-DD
    
    if (!habitId || completed === undefined || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const habit = await Habit.findOne({ _id: habitId, userId: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    const log = await HabitLog.findOneAndUpdate(
      { userId: req.user.id, habitId, date },
      { completed },
      { new: true, upsert: true }
    );

    res.json({ success: true, log });
  } catch (error) {
    console.error('Checkin habit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLocalYMD = (dateObj) => {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
};

const getHabitAnalytics = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    const analytics = [];

    const today = new Date();
    const todayStr = getLocalYMD(today);
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    
    // Get total days in current month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (const habit of habits) {
      const logs = await HabitLog.find({ habitId: habit._id, userId: req.user.id }).sort({ date: 1 });
      
      // Calculate best streak
      let bestStreak = 0;
      let tempStreak = 0;
      
      for (const log of logs) {
        if (log.completed) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      const todayLog = logs.find(l => l.date === todayStr);
      
      // Start counting from yesterday if today isn't checked in yet (to not prematurely break a streak)
      if (!todayLog || !todayLog.completed) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const checkDateStr = getLocalYMD(checkDate);
        const log = logs.find(l => l.date === checkDateStr);
        
        if (log && log.completed) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate monthly completion
      const monthlyLogs = logs.filter(l => l.date.startsWith(currentMonthPrefix) && l.completed);
      const monthlyCompletion = Math.min((monthlyLogs.length / daysInMonth) * 100, 100).toFixed(1);

      // Generate last 7 days status for contribution grid
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = getLocalYMD(d);
        const l = logs.find(log => log.date === dStr);
        last7Days.push({
          date: dStr,
          completed: l ? l.completed : false,
          isFuture: d > today // Should mostly be false unless timezone stuff, but handles if we extended matrix
        });
      }

      analytics.push({
        habitId: habit._id,
        name: habit.name,
        currentStreak,
        bestStreak,
        monthlyCompletion: parseFloat(monthlyCompletion),
        last7Days
      });
    }

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Habits analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHabits,
  createHabit,
  deleteHabit,
  checkinHabit,
  getHabitAnalytics
};
