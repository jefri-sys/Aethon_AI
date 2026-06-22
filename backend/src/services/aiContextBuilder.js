const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const StudyTask = require('../models/StudyTask');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const FocusSession = require('../models/FocusSession');
const { calculateCGPA } = require('./academicService');

async function buildStudentContext(userId) {
  const now = new Date();
  
  // Date ranges
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fetch in parallel
  const [
    cgpaData,
    user,
    upcomingExams,
    tasksDue,
    budgetData,
    spentData,
    habitsData,
    habitLogsData,
    studyHoursData
  ] = await Promise.all([
    calculateCGPA(userId),
    User.findById(userId).lean(),
    Subject.find({
      userId,
      examDate: { $gte: now, $lte: thirtyDaysFromNow }
    }).lean(),
    StudyTask.find({
      userId,
      dueDate: { $lte: sevenDaysFromNow },
      status: { $in: ['Pending', 'In Progress'] }
    }).lean(),
    Budget.findOne({ userId }).lean(),
    Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    Habit.find({ userId }).lean(),
    HabitLog.find({
      userId,
      date: { $gte: sevenDaysAgoStr }
    }).lean(),
    FocusSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$durationMinutes' }
        }
      }
    ])
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  // Format data
  const name = user.name;
  const course = user.course;
  const semester = user.semester;
  const currentCGPA = cgpaData?.cgpa ?? 'N/A';
  const targetCGPA = user.targetCGPA ?? 'N/A';

  const examsSummary = upcomingExams.length 
    ? upcomingExams.map(e => `${e.name} (${new Date(e.examDate).toISOString().split('T')[0]})`).join(', ')
    : 'None';

  const tasksSummary = tasksDue.length
    ? tasksDue.map(t => `${t.title} (${new Date(t.dueDate).toISOString().split('T')[0]})`).join(', ')
    : 'None';

  const spent = spentData[0]?.total || 0;
  const total = budgetData?.totalBudget || 0;

  const studyHours = ((studyHoursData[0]?.totalMinutes || 0) / 60).toFixed(1);

  const habitCompletionList = habitsData.map(habit => {
    const logs = habitLogsData.filter(log => 
      log.habitId.toString() === habit._id.toString() && log.completed
    );
    return `${habit.name}: ${logs.length}/7`;
  });
  const habitsSummary = habitCompletionList.length ? habitCompletionList.join(', ') : 'No habits tracked';

  // Construct context string
  return `STUDENT CONTEXT:
Student: ${name}, ${course} Semester ${semester}
Current CGPA: ${currentCGPA} | Target CGPA: ${targetCGPA}
Upcoming exams: ${examsSummary}
Tasks due this week: ${tasksSummary}
Budget: Spent ${spent} of ${total} this month
Study hours last 7 days: ${studyHours}h
Habit completion: ${habitsSummary}`;
}

module.exports = {
  buildStudentContext
};
