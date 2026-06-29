import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Utensils, Car, BookOpen, Tv, Home, Receipt, Fuel, ShoppingBag, Tag, Trash2, Loader, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

export default function MobileFinance() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'analytics'
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', note: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const chartColors = ['#FF7A59', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0088FE', '#00C49F'];

  useEffect(() => {
    fetchData();
    setInsight('');
  }, [currentMonth]);

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get(`/expenses/summary?month=${monthStr}`),
        api.get(`/expenses?month=${monthStr}`)
      ]);
      setSummary(sumRes.data.summary);
      setExpenses(expRes.data.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    if (!newExpense.amount || !newExpense.category) return;
    
    setSaving(true);
    try {
      await api.post('/expenses', {
        amount: Number(newExpense.amount),
        category: newExpense.category,
        note: newExpense.note
      });
      setShowAddExpense(false);
      setNewExpense({ amount: '', category: 'Food', note: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case 'food': return { icon: <Utensils size={18} />, bg: "var(--mobile-warning-subtle)", text: "var(--mobile-warning)" };
      case 'transport': return { icon: <Car size={18} />, bg: "var(--mobile-primary-subtle)", text: "var(--mobile-primary)" };
      case 'petrol': return { icon: <Fuel size={18} />, bg: "var(--mobile-danger-subtle)", text: "var(--mobile-danger)" };
      case 'shopping': return { icon: <ShoppingBag size={18} />, bg: "rgba(124, 111, 240, 0.1)", text: "var(--mobile-secondary)" };
      case 'books': return { icon: <BookOpen size={18} />, bg: "rgba(124, 111, 240, 0.1)", text: "var(--mobile-secondary)" };
      case 'entertainment': return { icon: <Tv size={18} />, bg: "var(--mobile-danger-subtle)", text: "var(--mobile-danger)" };
      case 'hostel': return { icon: <Home size={18} />, bg: "var(--mobile-success-subtle)", text: "var(--mobile-success)" };
      case 'miscellaneous': return { icon: <Tag size={18} />, bg: "var(--mobile-surface-raised)", text: "var(--mobile-text-secondary)" };
      default: return { icon: <Receipt size={18} />, bg: "var(--mobile-surface-raised)", text: "var(--mobile-text-secondary)" };
    }
  };

  const totalSpent = summary?.totalSpent || 0;
  const totalBudget = summary?.totalBudget || 0;
  const remaining = summary?.remaining || 0;
  const spentPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  const getProgressColor = (percent) => {
    if (percent < 80) return 'var(--mobile-success)';
    if (percent <= 90) return 'var(--mobile-warning)';
    return 'var(--mobile-danger)';
  };

  const pieData = summary?.categorySummary?.map(c => ({
    name: c.category,
    value: c.spent
  })).filter(c => c.value > 0) || [];

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Finance</h1>
        <button 
          onClick={() => setShowAddExpense(true)}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)' }}
        >
          <Plus color="#fff" size={24} />
        </button>
      </div>

      {/* BUDGET HERO CARD */}
      <div style={{ background: 'linear-gradient(135deg, rgba(255,122,89,0.15) 0%, var(--mobile-surface) 100%)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)', marginBottom: '8px' }}>Budget Left</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: isOverBudget ? 'var(--mobile-danger)' : 'var(--mobile-text-primary)', marginBottom: '16px' }}>
          {isOverBudget ? `-₹${Math.abs(remaining)}` : `₹${remaining}`}
        </div>
        <div style={{ width: '100%', height: '12px', background: 'var(--mobile-surface-raised)', borderRadius: '999px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '999px', width: `${spentPercent}%`, background: isOverBudget ? 'var(--mobile-danger)' : 'var(--mobile-primary)' }} />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mobile-text-tertiary)' }}>
          ₹{totalSpent} spent of ₹{totalBudget}
        </div>
      </div>

      {/* SUB-TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--mobile-surface)', padding: '4px', borderRadius: '16px' }}>
        <button 
          onClick={() => setActiveTab('recent')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'recent' ? 'var(--mobile-primary)' : 'transparent', color: activeTab === 'recent' ? '#fff' : 'var(--mobile-text-secondary)', fontSize: '15px', fontWeight: 600, border: 'none', transition: 'all 0.2s' }}
        >
          Recent
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'analytics' ? 'var(--mobile-primary)' : 'transparent', color: activeTab === 'analytics' ? '#fff' : 'var(--mobile-text-secondary)', fontSize: '15px', fontWeight: 600, border: 'none', transition: 'all 0.2s' }}
        >
          Analytics
        </button>
      </div>

      {/* EXPENSES LIST */}
      {activeTab === 'recent' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Receipt size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
            <div>No expenses yet this month.</div>
          </div>
        ) : (
          expenses.map(exp => {
            const theme = getCategoryTheme(exp.category);
            return (
              <div key={exp._id} style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.bg, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {theme.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exp.note || exp.category}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--mobile-text-tertiary)' }}>
                    {exp.category} • {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>₹{exp.amount}</span>
                  <button onClick={(e) => handleDeleteExpense(e, exp._id)} style={{ padding: '4px', background: 'none', border: 'none' }}>
                    <Trash2 size={14} color="var(--mobile-danger)" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* ANALYTICS TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Insight Button/Card */}
          <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mobile-primary)', fontWeight: 700, fontSize: '16px' }}>
                <Sparkles size={18} /> AI Financial Insight
              </div>
              {!insight && !insightLoading && (
                <button onClick={fetchInsight} style={{ padding: '8px 12px', borderRadius: '12px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', fontWeight: 700, fontSize: '13px', border: 'none' }}>
                  Generate
                </button>
              )}
            </div>
            {insightLoading && (
              <div style={{ padding: '12px', color: 'var(--mobile-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader size={16} className="animate-spin" /> Analyzing your spending patterns...
              </div>
            )}
            {insight && (
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--mobile-text-secondary)', background: 'var(--mobile-surface-raised)', padding: '12px', borderRadius: '16px' }}>
                {insight}
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>Spending Breakdown</h3>
            {pieData.length > 0 ? (
              <div style={{ width: '100%', height: '220px' }}>
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
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: 'var(--mobile-surface)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--mobile-text-primary)', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mobile-text-tertiary)' }}>No expenses to breakdown.</div>
            )}
          </div>

          {/* Category Summary Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {summary?.categorySummary?.map(cat => (
              <div key={cat.category} style={{ background: 'var(--mobile-surface)', borderRadius: '20px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--mobile-text-primary)', fontSize: '15px' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: getProgressColor(cat.percentUsed), fontSize: '14px' }}>{cat.percentUsed.toFixed(0)}%</span>
                </div>
                <div style={{ width: '100%', background: 'var(--mobile-surface-raised)', borderRadius: '999px', height: '6px', marginBottom: '8px' }}>
                  <div style={{ height: '6px', borderRadius: '999px', background: getProgressColor(cat.percentUsed), width: `${Math.min(cat.percentUsed, 100)}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--mobile-text-secondary)' }}>₹{cat.spent} / ₹{cat.allocated}</span>
                  <span style={{ fontWeight: 600, color: 'var(--mobile-text-primary)' }}>₹{cat.allocated - cat.spent} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD EXPENSE SHEET */}
      {showAddExpense && (
        <>
          <div 
            onClick={() => !saving && setShowAddExpense(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(4px)' }} 
          />
          <div 
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', zIndex: 101, padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}
            className="animate-in slide-in-from-bottom duration-300"
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--mobile-border)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Add Expense</h2>
              <button onClick={() => !saving && setShowAddExpense(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <X size={18} color="var(--mobile-text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Amount (₹) *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="e.g. 150"
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Category *</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)', appearance: 'none' }}
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Books">Books</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Title / Note</label>
                <input 
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  placeholder="e.g. Lunch at cafeteria"
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>

              <button 
                type="submit"
                disabled={saving || !newExpense.amount}
                style={{ marginTop: '16px', width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', opacity: (saving || !newExpense.amount) ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
