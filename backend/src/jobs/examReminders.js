const cron = require('node-cron');
const ExamSchedule = require('../models/ExamSchedule');
const { createNotification } = require('../services/notificationService');

const startExamReminders = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('Running exam reminders job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDates = [
        { days: 3, message: 'Prepare now.' },
        { days: 1, message: 'Final preparation time!' }
      ];

      for (const target of targetDates) {
        const examDateTarget = new Date(today);
        examDateTarget.setDate(examDateTarget.getDate() + target.days);
        
        const nextDay = new Date(examDateTarget);
        nextDay.setDate(nextDay.getDate() + 1);

        const exams = await ExamSchedule.find({
          date: {
            $gte: examDateTarget,
            $lt: nextDay
          }
        }).populate('subjectId', 'name');

        for (const exam of exams) {
          const subjectName = exam.subjectId ? exam.subjectId.name : 'Unknown Subject';
          await createNotification(
            exam.userId,
            'EXAM_ALERT',
            `Exam in ${target.days} day(s): ${subjectName}`,
            target.message
          );
        }
      }
    } catch (error) {
      console.error('Error running exam reminders job:', error);
    }
  });
};

module.exports = startExamReminders;
