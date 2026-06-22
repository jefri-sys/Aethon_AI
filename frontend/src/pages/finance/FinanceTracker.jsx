import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ChevronLeft, ChevronRight, DollarSign, Wallet, Plus, X, Trash2 } from 'lucide-react';

export default function FinanceTracker() {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', note: '', recurring: false, overspendSource: '' });

  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const fetchData = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get(`/expenses/summary?month=${monthStr}`),
        api.get(`/expenses?month=${monthStr}`)
      ]);
      setSummary(sumRes.data.summary);
      setExpenses(expRes.data.expenses);
      
      // Clear insight when month changes
      setInsight('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInsight = async () => {
    setInsightLoading(true);
    setInsight('');
    try {
      const res = await api.get(`/ai/finance-insight?month=${monthStr}`);
      if (res.data.success) {
        setInsight(res.data.insight);
      }
    } catch (err) {
      console.error('Failed to get finance insight', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        amount: Number(newExpense.amount),
        category: newExpense.category,
        note: newExpense.note,
        recurring: newExpense.recurring,
        overspendSource: newExpense.overspendSource || undefined
      });
      setShowExpenseModal(false);
      setNewExpense({ amount: '', category: 'Food', note: '', recurring: false, overspendSource: '' });
      fetchData(); // Refresh list & summary
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const parsedBudget = parseFloat(newTotalBudget);
      if (isNaN(parsedBudget) || parsedBudget <= 0) return alert('Invalid budget amount');
      
      const res = await api.put('/budget', { totalBudget: parsedBudget, month: monthStr });
      if (res.data.success) {
        setSummary(prev => ({ ...prev, totalBudget: parsedBudget, remaining: parsedBudget - prev.totalSpent }));
        setIsEditingBudget(false);
      }
    } catch (err) {
      alert('Failed to update budget');
    }
  };

  const exportCsv = async () => {
    try {
      const response = await api.get('/finance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 80) return 'bg-green-500';
    if (percent <= 90) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getTextColor = (percent) => {
    if (percent < 80) return 'text-green-600';
    if (percent <= 90) return 'text-amber-600';
    return 'text-red-600';
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const groupedExpenses = expenses.reduce((acc, exp) => {
    const date = exp.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {});

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

  if (!summary) return <ProtectedPage><div className="p-8">Loading...</div></ProtectedPage>;

  const pieData = summary.categorySummary.map(c => ({
    name: c.category,
    value: c.spent
  })).filter(c => c.value > 0);

  return (
    <ProtectedPage title="Finance Tracker" description="Manage your student budget and track expenses.">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5"/></button>
            <span className="font-bold w-32 text-center">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5"/></button>
          </div>
          
          {/* AI Insight Button placed after the month */}
          <button 
            onClick={fetchInsight}
            disabled={insightLoading}
            className="flex items-center justify-center p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100"
            title="Generate AI Financial Insight"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={insightLoading ? "animate-spin" : ""}><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 font-semibold text-sm">
            <Plus className="w-4 h-4"/> Add Expense
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 font-semibold text-sm">
            <Download className="w-4 h-4"/> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-500"/> Total Budget Overview
              </h3>
              {!isEditingBudget ? (
                <button onClick={() => { setIsEditingBudget(true); setNewTotalBudget(summary.totalBudget || ''); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={handleUpdateBudget} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                  <button onClick={() => setIsEditingBudget(false)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-500 font-medium">Spent</p>
                <p className="text-3xl font-black text-gray-900">₹{summary.totalSpent}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Remaining</p>
                {isEditingBudget ? (
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xl font-bold text-gray-400">₹</span>
                    <input 
                      type="number" 
                      value={newTotalBudget} 
                      onChange={(e) => setNewTotalBudget(e.target.value)}
                      className="text-xl font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 w-24 outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className={`text-xl font-bold ${summary.remaining < 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                    {summary.remaining < 0 ? `-₹${Math.abs(summary.remaining)}` : `₹${summary.remaining}`}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${summary.remaining < 0 ? 'bg-rose-500' : getProgressColor((summary.totalSpent / summary.totalBudget) * 100)}`} 
                style={{ width: `${Math.min((summary.totalSpent / summary.totalBudget) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-gray-400 font-medium">of ₹{summary.totalBudget} allocated</div>
          </div>

          {/* AI Insight Card - Only appears when generated */}
          {(insight || insightLoading) && (
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex gap-4">
              <div className="bg-indigo-100 p-2 rounded-full h-fit text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 mb-1">AI Financial Insight</h4>
                {insightLoading ? (
                  <p className="text-sm text-indigo-600/70 animate-pulse">Analyzing your spending patterns...</p>
                ) : (
                  <p className="text-sm text-indigo-800 leading-relaxed">{insight}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.categorySummary.map(cat => (
              <div key={cat.category} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-800">{cat.category}</span>
                  <span className={`font-bold ${getTextColor(cat.percentUsed)}`}>{cat.percentUsed.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(cat.percentUsed)}`} 
                    style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">₹{cat.spent} / ₹{cat.allocated}</span>
                  <span className="font-medium text-gray-700">₹{cat.allocated - cat.spent} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4 w-full">Spending Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">No expenses yet</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Recent Expenses</h3>
        </div>
        <div className="p-0">
          {Object.keys(groupedExpenses).sort((a,b) => new Date(b) - new Date(a)).map(date => (
            <div key={date} className="border-b border-gray-50 last:border-0">
              <div className="bg-gray-50 px-5 py-2 text-xs font-bold text-gray-500 uppercase">{date}</div>
              {groupedExpenses[date].map(exp => (
                <div key={exp._id} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <DollarSign className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{exp.note || exp.category}</p>
                      <p className="text-sm text-gray-500">{exp.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-black text-gray-900">₹{exp.amount}</div>
                    <button onClick={() => handleDeleteExpense(exp._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {expenses.length === 0 && <div className="p-8 text-center text-gray-400 font-medium">No expenses recorded for this month.</div>}
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Add New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Books">Books</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Note (Optional)</label>
                <input 
                  type="text" 
                  value={newExpense.note}
                  onChange={e => setNewExpense({...newExpense, note: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Pizza with friends"
                />
              </div>

              {((summary?.remaining || 0) - Number(newExpense.amount || 0)) < 0 && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <p className="text-sm font-semibold text-rose-800 mb-2">
                    ⚠️ You're going over budget!
                  </p>
                  <p className="text-xs text-rose-600 mb-3">
                    Where did the extra money come from? (Optional)
                  </p>
                  <select 
                    value={newExpense.overspendSource}
                    onChange={e => setNewExpense({...newExpense, overspendSource: e.target.value})}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none bg-white text-rose-900"
                  >
                    <option value="">Select source...</option>
                    <option value="Borrowed from friend">Borrowed from friend</option>
                    <option value="Extra from parents">Extra from parents</option>
                    <option value="Used savings">Used savings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input 
                  type="checkbox" 
                  checked={newExpense.recurring} 
                  onChange={e => setNewExpense({...newExpense, recurring: e.target.checked})}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Recurring Monthly Expense</span>
              </label>
              
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors mt-2">
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
