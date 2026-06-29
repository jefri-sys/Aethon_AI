import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Flame, Award, Trash2, Check } from 'lucide-react';
import api from '../../../services/api';

export default function MobileHabits() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/habits/analytics');
      setAnalytics(res.data.analytics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    setSaving(true);
    try {
      await api.post('/habits', { name: newHabitName });
      setNewHabitName('');
      setShowAddHabit(false);
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add habit');
    } finally {
      setSaving(false);
    }
  };

  const toggleCheckin = async (habitId, currentStatus, date) => {
    try {
      // Optimistic update
      setAnalytics(prev => prev.map(h => {
        if (h.habitId === habitId) {
          const new7Days = [...(h.last7Days || [])];
          if (new7Days.length > 0) {
            new7Days[new7Days.length - 1].completed = !currentStatus;
          }
          return { ...h, last7Days: new7Days };
        }
        return h;
      }));

      await api.patch('/habits/checkin', {
        habitId,
        date,
        completed: !currentStatus
      });
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      fetchAnalytics(); // Revert on failure
    }
  };

  const deleteHabit = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this habit entirely?')) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const isAtLimit = analytics.length >= 6;

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
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Habits</h1>
        <button 
          onClick={() => !isAtLimit && setShowAddHabit(true)}
          disabled={isAtLimit}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: isAtLimit ? 'var(--mobile-surface-raised)' : 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: isAtLimit ? 'none' : '0px 6px 16px rgba(255,122,89,0.35)', opacity: isAtLimit ? 0.5 : 1 }}
        >
          <Plus color={isAtLimit ? 'var(--mobile-text-tertiary)' : '#fff'} size={24} />
        </button>
      </div>

      {/* HABIT CARDS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
        ) : analytics.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Flame size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
            <div>No habits created yet. Click + to start!</div>
          </div>
        ) : (
          analytics.map(habit => {
            const todayLog = habit.last7Days?.[habit.last7Days.length - 1];
            const isCompletedToday = todayLog?.completed || false;
            const todayDate = todayLog?.date;

            return (
              <div key={habit.habitId} style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', position: 'relative' }}>
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, paddingRight: '10px', wordBreak: 'break-word', flex: 1 }}>
                    {habit.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={(e) => deleteHabit(e, habit.habitId)} style={{ padding: '6px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={18} color="var(--mobile-text-tertiary)" />
                    </button>
                    <button 
                      onClick={() => toggleCheckin(habit.habitId, isCompletedToday, todayDate)}
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCompletedToday ? 'var(--mobile-primary)' : 'transparent',
                        border: isCompletedToday ? 'none' : '2px solid var(--mobile-border)',
                        boxShadow: isCompletedToday ? '0px 4px 12px rgba(255,122,89,0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isCompletedToday && <Check size={20} color="#fff" />}
                    </button>
                  </div>
                </div>

                {/* Streaks */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={16} color="var(--mobile-warning)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>
                      {habit.currentStreak} Streak
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color="var(--mobile-secondary)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>
                      {habit.bestStreak} Best
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>Monthly Completion</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mobile-primary)' }}>{habit.monthlyCompletion}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--mobile-surface-raised)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${habit.monthlyCompletion}%`, background: 'var(--mobile-primary)' }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD HABIT SHEET */}
      {showAddHabit && (
        <>
          <div 
            onClick={() => !saving && setShowAddHabit(false)}
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
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Add Habit</h2>
              <button onClick={() => !saving && setShowAddHabit(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <X size={18} color="var(--mobile-text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Habit Name *</label>
                <input 
                  required
                  autoFocus
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Read 10 pages, Meditate"
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>

              <button 
                type="submit"
                disabled={saving || !newHabitName.trim()}
                style={{ marginTop: '16px', width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', opacity: (saving || !newHabitName.trim()) ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Habit'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
