import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { Plus, Flame, Award, CalendarDays, CheckCircle2, Circle } from 'lucide-react';

export default function HabitTracker() {
  const [analytics, setAnalytics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  
  // To draw the github contribution grid, we need logs. 
  // We'll fetch raw habits and we'll just check today's status locally for the toggle
  // Since we only get 'analytics', let's also fetch a local view of recent completions if possible, or just build the check-in based on current checkin state. Wait, the API doesn't return the raw logs matrix. Let's just track "todayCheckedIn" via the streak or a separate check? 
  // Let's add a "checkedInToday" flag to analytics backend... Ah I can't easily change it now, I'll just check if currentStreak > 0 AND it's checked in. Let's just do a basic toggle.
  
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/habits/analytics');
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    try {
      await api.post('/habits', { name: newHabitName });
      setNewHabitName('');
      setShowModal(false);
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add habit');
    }
  };

  const toggleCheckin = async (habitId) => {
    const habit = analytics.find(h => h.habitId === habitId);
    if (!habit || !habit.last7Days) return;
    
    const todayLog = habit.last7Days[habit.last7Days.length - 1];
    const newStatus = !todayLog.completed;
    
    try {
      await api.patch('/habits/checkin', {
        habitId,
        date: todayLog.date,
        completed: newStatus
      });
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHabit = async (id) => {
    if (!window.confirm("Delete this habit entirely?")) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedPage title="Habits Tracker" description="Build good routines and track your daily streaks.">
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setShowModal(true)}
          disabled={analytics.length >= 6}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="w-5 h-5"/> Add Habit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analytics.map(habit => (
          <div key={habit.habitId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative group">
            <button onClick={() => deleteHabit(habit.habitId)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              &times;
            </button>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-900">{habit.name}</h3>
              <button onClick={() => toggleCheckin(habit.habitId)} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                {habit.last7Days && habit.last7Days[habit.last7Days.length - 1].completed ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Circle className="w-8 h-8 text-gray-300" />
                )}
              </button>
            </div>
            
            {/* GitHub Contribution Grid (7 Days) */}
            <div className="mb-6 flex items-center gap-1.5 justify-center">
              {habit.last7Days && habit.last7Days.map((day, idx) => (
                <div 
                  key={day.date}
                  title={day.date}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    day.isFuture 
                      ? 'bg-gray-100 text-gray-300' 
                      : day.completed 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {['S','M','T','W','T','F','S'][new Date(day.date).getDay()]}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col items-center">
                <Flame className="w-6 h-6 text-orange-500 mb-1"/>
                <span className="text-2xl font-black text-orange-600">{habit.currentStreak}</span>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Current Streak</span>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center">
                <Award className="w-6 h-6 text-indigo-500 mb-1"/>
                <span className="text-2xl font-black text-indigo-600">{habit.bestStreak}</span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Best Streak</span>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">Monthly Completion</span>
                <span className="font-bold text-indigo-600">{habit.monthlyCompletion}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${habit.monthlyCompletion}%` }}></div>
              </div>
            </div>
          </div>
        ))}
        {analytics.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-white rounded-2xl border border-gray-100 border-dashed">
            No habits created yet. Click "Add Habit" to get started!
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Create New Habit</h3>
            <form onSubmit={addHabit}>
              <input 
                type="text" 
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                placeholder="e.g. Read 10 pages, Meditate"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={!newHabitName.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
