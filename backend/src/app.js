const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const academicsRoutes = require('./routes/academics');
const plannerRoutes = require('./routes/planner');
const focusRoutes = require('./routes/focus');
const notebookRoutes = require('./routes/notebook');
const financeRoutes = require('./routes/finance');
const habitsRoutes = require('./routes/habits');
const aiRoutes = require('./routes/ai');
const notificationsRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendar');
const semesterRoutes = require('./routes/semesters');
const timetableRoutes = require('./routes/timetable');
const examRoutes = require('./routes/exams');
const groupsRoutes = require('./routes/groups');
const friendsRoutes = require('./routes/friends');
const conversationRoutes = require('./routes/conversations');
const callsRoutes = require('./routes/calls');
const resourcesRoutes = require('./routes/resources');
const customPdfPlanRoutes = require('./routes/customPdfPlan');
const settingsRoutes = require('./routes/settings');
const careerVaultRoutes = require('./routes/careerVaultRoutes');

const app = express();

app.use(helmet({
  xFrameOptions: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', academicsRoutes);
app.use('/api', plannerRoutes);
app.use('/api', focusRoutes);
app.use('/api', notebookRoutes);
app.use('/api', financeRoutes);
app.use('/api', habitsRoutes);
app.use('/api', aiRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api', timetableRoutes);
app.use('/api', examRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/custom-pdf-plan', customPdfPlanRoutes);
app.use('/api/career-vault', careerVaultRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'synapse-backend'
  });
});

module.exports = app;
