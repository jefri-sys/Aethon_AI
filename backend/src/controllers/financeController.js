const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { amount, category, note, date, recurring, overspendSource } = req.body;
    
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }
    
    const validCategories = ["Food", "Transport", "Books", "Entertainment", "Hostel", "Miscellaneous"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      amount,
      category,
      note,
      date: date || Date.now(),
      recurring: recurring || false,
      overspendSource: overspendSource || undefined
    });

    let budgetStatus = null;
    
    // Check budget warnings
    const expenseDate = new Date(expense.date);
    const monthStr = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
    
    let budget = await Budget.findOne({ userId: req.user.id, month: monthStr });
    if (!budget) {
      budget = await Budget.findOne({ userId: req.user.id, month: { $exists: false } }) || await Budget.findOne({ userId: req.user.id });
    }

    if (budget) {
      const startOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
      const endOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Category spending
      const categoryExpenses = await Expense.aggregate([
        { 
          $match: { 
            userId: req.user.id, 
            category: category,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const categorySpent = categoryExpenses.length > 0 ? categoryExpenses[0].total : 0;
      const categoryBudget = budget[category.toLowerCase()] || 0;

      if (categoryBudget > 0 && categorySpent >= categoryBudget * 0.8) {
        await Notification.create({
          userId: req.user.id,
          type: 'BUDGET_WARNING',
          title: 'Budget Alert',
          message: `You have used ${((categorySpent/categoryBudget)*100).toFixed(0)}% of your ${category} budget`
        });
      }

      // Total spending
      const allExpenses = await Expense.aggregate([
        { 
          $match: { 
            userId: req.user.id, 
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalSpent = allExpenses.length > 0 ? allExpenses[0].total : 0;
      const totalBudget = budget.totalBudget || 0;

      if (totalBudget > 0 && totalSpent > totalBudget) {
        // Only send if it wasn't already sent or we could debounce, but for now we just create it.
        const overBy = totalSpent - totalBudget;
        await Notification.create({
          userId: req.user.id,
          type: 'BUDGET_WARNING',
          title: 'Budget Alert',
          message: `You've exceeded your monthly budget by ₹${overBy}. You've spent ₹${totalSpent} of your ₹${totalBudget} budget.`
        });
      } else if (totalBudget > 0 && totalSpent >= totalBudget * 0.9 && totalSpent <= totalBudget) {
        await Notification.create({
          userId: req.user.id,
          type: 'BUDGET_WARNING',
          title: 'Budget Alert',
          message: `You have used ${((totalSpent/totalBudget)*100).toFixed(0)}% of your total monthly budget.`
        });
      }

      budgetStatus = {
        categorySpent,
        categoryBudget,
        totalSpent,
        totalBudget
      };
    }

    res.status(201).json({ success: true, expense, budgetStatus });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses?month=YYYY-MM
const getExpenses = async (req, res) => {
  try {
    const { month } = req.query;
    let query = { userId: req.user.id };

    if (month) {
      // month is expected to be 'YYYY-MM'
      const [year, m] = month.split('-');
      const start = new Date(year, parseInt(m) - 1, 1);
      const end = new Date(year, parseInt(m), 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    await Expense.findByIdAndDelete(expense._id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/summary
const getExpenseSummary = async (req, res) => {
  try {
    const { month } = req.query;
    let startOfMonth, endOfMonth;
    
    if (month) {
      const [year, m] = month.split('-');
      startOfMonth = new Date(year, parseInt(m) - 1, 1);
      endOfMonth = new Date(year, parseInt(m), 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const expenses = await Expense.find({
      userId: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const currentMonthStr = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let budget = await Budget.findOne({ userId: req.user.id, month: currentMonthStr });
    if (!budget) {
      // Fallback to global budget if no monthly override
      budget = await Budget.findOne({ userId: req.user.id, month: { $exists: false } }) || await Budget.findOne({ userId: req.user.id });
    }

    if (!budget) {
      // Default fallback
      budget = {
        totalBudget: 5000,
        food: 1500,
        transport: 500,
        books: 500,
        entertainment: 500,
        hostel: 1500,
        miscellaneous: 500
      };
    }

    let totalSpent = 0;
    const categoryTotals = {};

    expenses.forEach(exp => {
      totalSpent += exp.amount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categorySummary = Object.keys(categoryTotals).map(cat => {
      const spent = categoryTotals[cat];
      const allocated = budget[cat.toLowerCase()] || 0;
      const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
      return {
        category: cat,
        spent,
        allocated,
        percentUsed
      };
    });

    res.json({
      success: true,
      summary: {
        totalSpent,
        totalBudget: budget.totalBudget,
        remaining: budget.totalBudget - totalSpent,
        categorySummary
      }
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/finance/export
const exportExpenses = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      userId: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1 });

    let csvString = "Date,Category,Amount,Note\n";
    
    expenses.forEach(exp => {
      const dateStr = exp.date.toISOString().split('T')[0];
      const category = `"${exp.category}"`;
      const amount = exp.amount;
      const note = `"${(exp.note || '').replace(/"/g, '""')}"`;
      
      csvString += `${dateStr},${category},${amount},${note}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csvString);
  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/budget
const updateBudget = async (req, res) => {
  try {
    const { totalBudget, food, transport, books, entertainment, hostel, miscellaneous, month } = req.body;
    
    // If month is provided, we override for that specific month. Otherwise, global budget.
    let query = { userId: req.user.id };
    if (month) query.month = month;
    else query.month = { $exists: false };

    let budget = await Budget.findOne(query);
    if (budget) {
      if (totalBudget !== undefined) budget.totalBudget = totalBudget;
      if (food !== undefined) budget.food = food;
      if (transport !== undefined) budget.transport = transport;
      if (books !== undefined) budget.books = books;
      if (entertainment !== undefined) budget.entertainment = entertainment;
      if (hostel !== undefined) budget.hostel = hostel;
      if (miscellaneous !== undefined) budget.miscellaneous = miscellaneous;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId: req.user.id,
        month,
        totalBudget,
        food,
        transport,
        books,
        entertainment,
        hostel,
        miscellaneous
      });
    }

    res.json({ success: true, budget });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  deleteExpense,
  getExpenseSummary,
  exportExpenses,
  updateBudget
};
