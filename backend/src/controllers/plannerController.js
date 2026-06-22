const { generateStudyPlan } = require('../services/studyPlannerService');
const StudyTask = require('../models/StudyTask');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');

const generatePlan = async (req, res) => {
  try {
    const { notebookIds, dailyHours, daysOff, knowledgeText, targetDate, availableDays } = req.body || {};
    const { tasks, warning } = await generateStudyPlan(req.user.id, notebookIds, { dailyHours, daysOff, knowledgeText, targetDate, availableDays });
    res.status(201).json({ success: true, tasks, warning });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const computePriorityScore = async (task, subjectsMap, marksMap) => {
  if (task.pinnedByUser) return { ...task.toObject(), priorityLabel: 'Pinned', priorityScore: -9999 };
  
  const now = new Date();
  
  let dueDateScore = 0;
  if (task.dueDate) {
    const daysRemaining = (new Date(task.dueDate) - now) / 86400000;
    dueDateScore = Math.max(0, daysRemaining) * 10;
  }
  
  let examProximityScore = 0;
  let weakSubjectPenalty = 0;
  let creditScore = 0;

  if (task.subjectId) {
    const subIdStr = task.subjectId.toString();
    const subject = subjectsMap[subIdStr];
    if (subject) {
      if (subject.examDate) {
        const daysToExam = (new Date(subject.examDate) - now) / 86400000;
        examProximityScore = Math.max(0, daysToExam) * 5;
      }
      creditScore = (subject.credits || 0) * 3;
    }
    
    const markData = marksMap[subIdStr];
    if (markData && markData.totalMax > 0) {
      const markPercent = (markData.totalObtained / markData.totalMax) * 100;
      weakSubjectPenalty = (markPercent < 60) ? -20 : 0;
    }
  }
  
  const priorityScore = dueDateScore + examProximityScore + weakSubjectPenalty + creditScore;
  
  let priorityLabel = "Low";
  if (priorityScore < 20) priorityLabel = "Critical";
  else if (priorityScore < 40) priorityLabel = "High";
  else if (priorityScore < 60) priorityLabel = "Medium";
  
  return {
    ...task.toObject(),
    priorityScore,
    priorityLabel
  };
};

const getTasks = async (req, res) => {
  try {
    const tasks = await StudyTask.find({ userId: req.user.id });
    
    const subjects = await Subject.find({ userId: req.user.id });
    const subjectsMap = {};
    subjects.forEach(s => { subjectsMap[s._id.toString()] = s; });
    
    const marks = await Mark.find({ userId: req.user.id });
    const marksMap = {};
    marks.forEach(m => {
      const subIdStr = m.subjectId.toString();
      if (!marksMap[subIdStr]) marksMap[subIdStr] = { totalObtained: 0, totalMax: 0 };
      if (m.marksObtained != null && m.totalMarks != null) {
        marksMap[subIdStr].totalObtained += m.marksObtained;
        marksMap[subIdStr].totalMax += m.totalMarks;
      }
    });

    const tasksWithPriority = [];
    for (const task of tasks) {
      const enhancedTask = await computePriorityScore(task, subjectsMap, marksMap);
      tasksWithPriority.push(enhancedTask);
    }

    tasksWithPriority.sort((a, b) => {
      if (a.pinnedByUser && !b.pinnedByUser) return -1;
      if (!a.pinnedByUser && b.pinnedByUser) return 1;
      return (a.priorityScore || 0) - (b.priorityScore || 0);
    });

    if (tasksWithPriority.length > 0) {
      console.log('GET /tasks - first task dueDate:', tasksWithPriority[0].dueDate);
    }

    res.json({ success: true, tasks: tasksWithPriority });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTasksToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await StudyTask.find({
      userId: req.user.id,
      status: { $in: ['Pending', 'In Progress'] },
      $or: [
        { scheduledDate: { $lt: tomorrow } },
        { dueDate: { $lt: tomorrow } }
      ]
    });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const taskData = { ...req.body, userId: req.user.id, isAIGenerated: false };
    const task = await StudyTask.create(taskData);
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await StudyTask.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const coverTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    if (!task.coveredTopics) task.coveredTopics = [];
    if (!task.coveredTopics.includes(topic)) {
      task.coveredTopics.push(topic);
    }
    
    await task.save();
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const togglePin = async (req, res) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    task.pinnedByUser = !task.pinnedByUser;
    await task.save();
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllTasks = async (req, res) => {
  try {
    await StudyTask.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'All tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const StudyPlan = require('../models/StudyPlan');

const getPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    if (plan.studyTaskIds && plan.studyTaskIds.length > 0) {
      await StudyTask.deleteMany({ _id: { $in: plan.studyTaskIds } });
    }
    
    await StudyPlan.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePlan,
  getTasks,
  getTasksToday,
  createTask,
  updateTaskStatus,
  coverTopic,
  togglePin,
  deleteTask,
  deleteAllTasks,
  getPlans,
  deletePlan
};
