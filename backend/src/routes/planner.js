const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
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
} = require('../controllers/plannerController');

const router = express.Router();

router.use(verifyToken);

// Planner route
router.post('/planner/generate', generatePlan);
router.get('/planner/plans', getPlans);
router.delete('/planner/plans/:id', deletePlan);

// Tasks routes
router.get('/tasks', getTasks);
router.get('/tasks/today', getTasksToday);
router.post('/tasks', createTask);
router.patch('/tasks/:id/status', updateTaskStatus);
router.patch('/tasks/:id/cover-topic', coverTopic);
router.patch('/tasks/:id/pin', togglePin);
router.delete('/tasks/all', deleteAllTasks);
router.delete('/tasks/:id', deleteTask);

module.exports = router;
