const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const financeController = require('../controllers/financeController');

router.post('/expenses', verifyToken, financeController.createExpense);
router.get('/expenses', verifyToken, financeController.getExpenses);
router.delete('/expenses/:id', verifyToken, financeController.deleteExpense);
router.get('/expenses/summary', verifyToken, financeController.getExpenseSummary);
router.get('/finance/export', verifyToken, financeController.exportExpenses);
router.put('/budget', verifyToken, financeController.updateBudget);

module.exports = router;
