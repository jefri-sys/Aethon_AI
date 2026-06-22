const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

/**
 * Calculates readiness score for a subject based on multiple weighted factors.
 * @param {String} userId 
 * @param {String} subjectId 
 * @returns {Object} { score, label, breakdown }
 */
async function calculateReadiness(userId, subjectId) {
  let attendanceScore = 0;
  let quizScore = 0;      // Phase 5
  let tasksScore = 0;     // Phase 3 / Phase 2
  let hoursScore = 0;     // Phase 3
  let coverageScore = 0;  // Phase 3

  // Factor 1: Attendance (20%)
  const attendance = await Attendance.findOne({ userId, subjectId });
  if (attendance && attendance.totalClasses > 0) {
    attendanceScore = attendance.percentage;
  }

  // Factor 2: Tasks (20%) - Using mongoose.models to prevent crash if Task model isn't defined yet
  const Task = mongoose.models.Task;
  if (Task) {
    const totalTasks = await Task.countDocuments({ userId, subjectId });
    if (totalTasks > 0) {
      const completedTasks = await Task.countDocuments({ 
        userId, 
        subjectId, 
        status: { $in: ['completed', 'done'] } 
      });
      tasksScore = (completedTasks / totalTasks) * 100;
    }
  }

  // Calculate weighted average
  // Since not all phases are implemented, we normalize the score based on the active weights
  const activeWeight = 0.40; // 20% attendance + 20% tasks
  const rawScore = (attendanceScore * 0.20) + (tasksScore * 0.20);
  const normalizedScore = rawScore / activeWeight;

  let finalScore = normalizedScore || 0;
  
  let label = 'green';
  if (finalScore < 40) {
    label = 'red';
  } else if (finalScore <= 70) {
    label = 'amber';
  }

  return {
    score: Number(finalScore.toFixed(1)),
    label,
    breakdown: {
      attendance: Number(attendanceScore.toFixed(1)),
      quiz: Number(quizScore.toFixed(1)),
      tasks: Number(tasksScore.toFixed(1)),
      hours: Number(hoursScore.toFixed(1)),
      coverage: Number(coverageScore.toFixed(1)),
    }
  };
}

module.exports = {
  calculateReadiness,
};
