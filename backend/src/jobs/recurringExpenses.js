const cron = require('node-cron');
const Expense = require('../models/Expense');

const startRecurringExpensesJob = () => {
  // Schedule: 1st day of month at 00:01
  cron.schedule("1 0 1 * *", async () => {
    try {
      // Find all Expense documents where recurring: true
      const recurringExpenses = await Expense.find({ recurring: true });
      let createdCount = 0;

      for (const exp of recurringExpenses) {
        // Create a new Expense document for today's date
        // Set recurring: false on the generated instance to prevent exponential duplication next month
        await Expense.create({
          userId: exp.userId,
          amount: exp.amount,
          category: exp.category,
          note: exp.note,
          date: new Date(),
          recurring: false
        });
        createdCount++;
      }

      console.log(`Recurring expense job ran. Created ${createdCount} transactions.`);
    } catch (error) {
      console.error('Error running recurring expense job:', error);
    }
  });
};

module.exports = startRecurringExpensesJob;
