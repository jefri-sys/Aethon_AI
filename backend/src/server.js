const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const mongoose = require('mongoose');
const { initSocket } = require('./socket/socket');
const socketHandler = require('./socket/socketHandler');

const app = require('./app');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = initSocket(server);
// socketHandler.init(server);
// const oldIo = socketHandler.getIO();

const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');

      const startRecurringExpensesJob = require('./jobs/recurringExpenses');
      startRecurringExpensesJob();

      const startWeeklyReportJob = require('./jobs/weeklyReport');
      startWeeklyReportJob();

      const startExamReminders = require('./jobs/examReminders');
      startExamReminders();

      const startHabitReminders = require('./jobs/habitReminders');
      startHabitReminders();

      const startEventReminders = require('./jobs/eventReminders');
      startEventReminders();

      const startTokenResetJob = require('./jobs/tokenReset');
      startTokenResetJob();
    } else {
      console.warn('MONGODB_URI is not set. Skipping MongoDB connection.');
    }

    server.listen(PORT, () => {
      console.log(`Aethon backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Aethon backend:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { server, io };

