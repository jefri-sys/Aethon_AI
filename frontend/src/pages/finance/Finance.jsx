import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import { Wallet, PieChart, TrendingUp, Receipt, Edit2, Check, X, Trash2 } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Finance() {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState('');

  useEffect(() => {
    fetchData();
    window.addEventListener('synapse_expense_added', fetchData);
    return () => window.removeEventListener('synapse_expense_added', fetchData);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        api.get('/expenses/summary'),
        api.get('/expenses')
      ]);
      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
      if (expensesRes.data.success) setExpenses(expensesRes.data.expenses);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const parsedBudget = parseFloat(newTotalBudget);
      if (isNaN(parsedBudget) || parsedBudget <= 0) return alert('Invalid budget amount');
      
      const res = await api.put('/budget', { totalBudget: parsedBudget });
      if (res.data.success) {
        setSummary(prev => ({ ...prev, totalBudget: parsedBudget, remaining: parsedBudget - prev.totalSpent }));
        setIsEditingBudget(false);
      }
    } catch (err) {
      alert('Failed to update budget');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData(); // Refresh all stats
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <ProtectedPage title="Finance Tracker" description="Manage your student budget.">
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      </ProtectedPage>
    );
  }

  const chartData = summary?.categorySummary?.filter(c => c.spent > 0).map(c => ({
    name: c.category,
    value: c.spent
  })) || [];

  return (
    <ProtectedPage
      title="Finance Tracker"
      description="Manage your student budget, track expenses, and plan your savings."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Budget Card */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Wallet className="w-5 h-5 text-indigo-500" />
              Monthly Budget
            </div>
            {!isEditingBudget ? (
              <button onClick={() => { setIsEditingBudget(true); setNewTotalBudget(summary?.totalBudget || ''); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={handleUpdateBudget} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditingBudget(false)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          
          {isEditingBudget ? (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-slate-400">$</span>
              <input 
                type="number" 
                value={newTotalBudget} 
                onChange={(e) => setNewTotalBudget(e.target.value)}
                className="text-4xl font-black text-slate-800 bg-slate-50 rounded-lg px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New budget"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-4xl font-black text-slate-800 mb-4">${summary?.totalBudget || 0}</div>
          )}

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${summary?.remaining < 0 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min(((summary?.totalSpent || 0) / (summary?.totalBudget || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm mt-3 font-medium">
            <span className="text-slate-500">Spent: <span className="text-slate-800">${summary?.totalSpent || 0}</span></span>
            <span className={summary?.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {summary?.remaining < 0 ? 'Over budget: ' : 'Remaining: '}${Math.abs(summary?.remaining || 0)}
            </span>
          </div>
        </div>

        {/* Expenses Overview */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" /> Spending Breakdown
          </h3>
          <div className="h-48 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 italic">No expenses logged this month.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" /> Recent Transactions
          </h3>
        </div>
        <div className="p-0">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">You haven't logged any expenses yet. Use the Quick Capture button below!</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Note</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{expense.note || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-right">${expense.amount}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteExpense(expense._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}

export default Finance;
