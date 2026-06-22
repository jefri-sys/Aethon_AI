const cron = require('node-cron');
const User = require('../models/User');
const StudyTask = require('../models/StudyTask');
const Expense = require('../models/Expense');
const HabitLog = require('../models/HabitLog');
const FocusSession = require('../models/FocusSession');
const WeeklyReport = require('../models/WeeklyReport');
const Notification = require('../models/Notification');
const { calculateCGPA } = require('../services/academicService');
const { routeRequest } = require('../services/aiRouter');

const generateReportForUser = async (user) => {
  const userId = user._id;
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [
    tasksData,
    spentData,
    habitsData,
    studyHoursData,
    cgpaData
  ] = await Promise.all([
    StudyTask.aggregate([
      { $match: { userId: userId, updatedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Expense.aggregate([
      { $match: { userId: userId, date: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    HabitLog.countDocuments({ userId: userId, date: { $gte: sevenDaysAgoStr }, completed: true }),
    FocusSession.aggregate([
      { $match: { userId: userId, completedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
    ]),
    calculateCGPA(userId)
  ]);

  let tasksCompleted = 0;
  let tasksMissed = 0;
  
  tasksData.forEach(t => {
    if (t._id === 'Completed') tasksCompleted = t.count;
    if (t._id === 'Missed') tasksMissed = t.count;
  });

  const totalSpent = spentData[0]?.total || 0;
  const habitsCompleted = habitsData || 0;
  const studyHours = ((studyHoursData[0]?.totalMinutes || 0) / 60).toFixed(1);
  const cgpaTrend = cgpaData?.cgpa || 'N/A';

  const context = `
  Study Hours: ${studyHours}h
  Tasks Completed: ${tasksCompleted}
  Tasks Missed: ${tasksMissed}
  Total Spent: $${totalSpent}
  Habits Completed: ${habitsCompleted}
  Current CGPA: ${cgpaTrend}
  `;

  const prompt = `Write a weekly report card. Start with: 'Your week at a glance.' 
  Summarize study performance, finances, and habits. 
  Give 3 specific action items for next week. 
  Data: ${context}`;

  const responseText = await routeRequest('weekly-report', { prompt, userId });

  const report = new WeeklyReport({
    userId,
    weekStartDate: sevenDaysAgoStr,
    content: responseText.trim(),
    studyHours: parseFloat(studyHours),
    tasksCompleted,
    tasksMissed,
    totalSpent,
    habitsCompleted
  });
  await report.save();

  await Notification.create({
    userId,
    type: 'WEEKLY_REPORT',
    title: 'Weekly Report',
    message: 'Your weekly report is ready'
  });
};

const runWeeklyReportJob = async () => {
  console.log('Starting weekly report job...');
  try {
    const users = await User.find({ emailVerified: true }).select('_id');
    let count = 0;
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      for (const user of batch) {
        try {
          await generateReportForUser(user);
          count++;
          // Add 500ms delay between users to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Error generating report for user ${user._id}:`, err);
        }
      }
    }
    
    console.log(`Weekly report job complete. Generated ${count} reports.`);
  } catch (error) {
    console.error('Error in weekly report job:', error);
  }
};

const startWeeklyReportJob = () => {
  cron.schedule("0 20 * * 0", () => {
    runWeeklyReportJob();
  });
};

module.exports = startWeeklyReportJob;
