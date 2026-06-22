import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth.js';
import { io } from 'socket.io-client';
import { Sparkles, TrendingUp, Wallet, Target, Calendar, CheckCircle2, Circle, Bell, ArrowRight } from 'lucide-react';
import NotificationsPopup from '../../components/NotificationsPopup.jsx';

function TodayDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    briefing: null,
    todayTasks: [],
    cgpa: null,
    budget: null,
    habitAnalytics: null,
    notifications: [],
    upcomingDeadlines: []
  });
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingLimitHit, setBriefingLimitHit] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch briefing independently so it can show its own skeleton
        api.get('/ai/briefing').then(res => {
          if (res.data.success) {
            setData(prev => ({ ...prev, briefing: res.data.content }));
          } else {
            setBriefingLimitHit(res.data.limitHit || false);
          }
          setBriefingLoading(false);
        }).catch(err => {
          console.error(err);
          if (err.response?.status === 429 || err.response?.data?.limitHit) {
            setBriefingLimitHit(true);
          }
          setBriefingLoading(false);
        });

        const semestersRes = await api.get('/semesters');
        let activeSemId = null;
        if (semestersRes.data?.success) {
          const workingSemId = localStorage.getItem('synapse_working_semester_id');
          if (workingSemId) {
            const workingSem = semestersRes.data.semesters.find(s => s._id === workingSemId);
            if (workingSem) activeSemId = workingSem._id;
          }
          if (!activeSemId) {
            const active = semestersRes.data.semesters.find(s => s.isActive);
            if (active) activeSemId = active._id;
          }
        }

        const [
          tasksRes,
          cgpaRes,
          expensesRes,
          habitsRes,
          notifRes,
          allTasksRes,
          examsRes
        ] = await Promise.allSettled([
          api.get('/tasks/today'),
          api.get('/academics/cgpa'),
          api.get('/expenses/summary'),
          api.get('/habits/analytics'),
          api.get('/notifications?limit=3'),
          api.get('/tasks'),
          activeSemId ? api.get(`/semesters/${activeSemId}/exams`) : Promise.resolve({ data: { success: true, exams: [] } })
        ]);

        const todayTasks = tasksRes.status === 'fulfilled' && tasksRes.value?.data?.success ? tasksRes.value.data.tasks : [];
        // Fix: cgpa is directly under data.cgpa, not data.data.cgpa
        const cgpa = cgpaRes.status === 'fulfilled' && cgpaRes.value?.data?.success ? cgpaRes.value.data.cgpa : null;
        const budget = expensesRes.status === 'fulfilled' && expensesRes.value?.data?.success ? expensesRes.value.data.summary.remaining : 0;
        const habitAnalytics = habitsRes.status === 'fulfilled' && habitsRes.value?.data?.success ? habitsRes.value.data.analytics : null;
        const notifications = notifRes.status === 'fulfilled' && notifRes.value?.data?.success ? notifRes.value.data.notifications : [];
        
        const allTasks = allTasksRes.status === 'fulfilled' && allTasksRes.value?.data?.success ? allTasksRes.value.data.tasks : [];
        const exams = examsRes.status === 'fulfilled' && examsRes.value?.data?.success ? examsRes.value.data.exams : [];

        // Calculate upcoming deadlines (next 7 days)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const next7Days = new Date(startOfToday);
        next7Days.setDate(startOfToday.getDate() + 7);

        const upcoming = [];
        
        allTasks.forEach(t => {
          if (t.dueDate) {
            const d = new Date(t.dueDate);
            const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (taskDate >= startOfToday && taskDate <= next7Days && t.status !== 'Completed') {
              upcoming.push({ type: 'task', title: t.title, date: taskDate, id: t._id });
            }
          }
        });

        exams.forEach(e => {
          if (e.date) {
            const d = new Date(e.date);
            const examDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (examDate >= startOfToday && examDate <= next7Days) {
              // Get subject name if populated, otherwise use 'Subject'
              const subjectName = e.subjectId?.name || e.subjectName || 'Subject';
              upcoming.push({ type: 'exam', title: `${subjectName} Exam`, date: examDate, id: e._id });
            }
          }
        });

        upcoming.sort((a, b) => a.date - b.date);

        console.log("DEBUG: allTasks length =", allTasks.length);
        console.log("DEBUG: upcoming length =", upcoming.length);
        console.log("DEBUG: upcoming =", upcoming);

        setData(prev => ({
          ...prev,
          todayTasks,
          cgpa,
          budget,
          habitAnalytics,
          notifications,
          upcomingDeadlines: upcoming
        }));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        withCredentials: true
      });

      socket.on('newNotification', (notif) => {
        setData(prev => {
          const newNotifs = [notif, ...prev.notifications].slice(0, 3);
          return { ...prev, notifications: newNotifs };
        });
      });

      return () => socket.disconnect();
    }
  }, []);

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        setData(prev => ({
          ...prev,
          todayTasks: prev.todayTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
        }));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Find nearest exam
  const getNearestExamDays = () => {
    const exam = data.upcomingDeadlines.find(d => d.type === 'exam');
    if (exam) {
      const diffTime = Math.abs(exam.date - new Date());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return '-';
  };

  const unreadCount = data.notifications.filter(n => !n.read).length;

  return (
    <ProtectedPage
      title="Overview"
      description="Your personalized academic dashboard."
    >
      <div className="flex justify-between items-end mb-6 mt-4">
        <h1 className="text-2xl font-bold text-slate-800">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <div className="relative">
          <div className="cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="w-6 h-6 text-slate-500 hover:text-slate-800 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-50">
                {unreadCount}
              </span>
            )}
          </div>
          <NotificationsPopup 
            isOpen={showNotifications} 
            onClose={async () => {
              setShowNotifications(false);
              try {
                const res = await api.get('/notifications?limit=3');
                if (res.data?.success) {
                  setData(prev => ({ ...prev, notifications: res.data.notifications }));
                }
              } catch (err) {
                console.error('Failed to refresh notifications:', err);
              }
            }} 
          />
        </div>
      </div>

      {/* AI Briefing Card */}
      <div className="mb-8 rounded-xl bg-indigo-600 p-6 text-indigo-50 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="mt-1 bg-indigo-500/30 p-2 rounded-lg h-min">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2 tracking-wide uppercase text-xs opacity-80">
              {briefingLimitHit ? "Daily Focus" : "AI Morning Briefing"}
            </h3>
            {briefingLoading ? (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-indigo-500/50 rounded w-3/4"></div>
                <div className="h-4 bg-indigo-500/50 rounded w-full"></div>
                <div className="h-4 bg-indigo-500/50 rounded w-5/6"></div>
              </div>
            ) : briefingLimitHit ? (
              <p className="italic text-sm md:text-base leading-relaxed">
                Good morning! Check your tasks and deadlines below for today's focus. 
                <span className="block mt-1 text-indigo-200 text-xs">(AI features will resume tomorrow)</span>
              </p>
            ) : (
              <p className="italic text-sm md:text-base leading-relaxed">
                {data.briefing || "Your briefing is unavailable right now."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Current CGPA</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">
            {data.cgpa !== null ? data.cgpa : '--'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Budget</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">
            ₹{data.budget !== null ? data.budget : '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Remaining this month</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Habit Streak</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">
            {data.habitAnalytics?.bestStreak || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Days best</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Next Exam</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">
            {getNearestExamDays()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Days away</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Tasks) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Today's Tasks</h3>
              <Link to="/planner" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            ) : data.todayTasks.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const manualTasks = data.todayTasks.filter(t => t.source !== 'ai_planner' && t.source !== 'custom_pdf_plan');
                  const aiTasks = data.todayTasks.filter(t => t.source === 'ai_planner' || t.source === 'custom_pdf_plan');
                  
                  const renderTask = (task) => (
                    <div key={task._id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                      <button onClick={() => toggleTaskStatus(task._id, task.status)} className="flex-shrink-0">
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                        )}
                      </button>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <>
                      {aiTasks.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Study Plan
                          </h4>
                          <div className="space-y-3">
                            {aiTasks.map(renderTask)}
                          </div>
                        </div>
                      )}

                      {manualTasks.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                             Manual Tasks
                          </h4>
                          <div className="space-y-3">
                            {manualTasks.map(renderTask)}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">No tasks scheduled for today. Enjoy your break!</p>
            )}
          </div>
        </div>

        {/* Sidebar (Deadlines & Notifications) */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Upcoming Deadlines</h3>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-slate-100 rounded w-full"></div>
                <div className="h-8 bg-slate-100 rounded w-full"></div>
              </div>
            ) : data.upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingDeadlines.slice(0, 5).map((deadline, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 line-clamp-1">{deadline.title}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${deadline.type === 'exam' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {deadline.type === 'exam' ? 'EXAM' : 'TASK'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {deadline.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-2">No deadlines in the next 7 days.</p>
            )}
          </div>

        </div>
      </div>
    </ProtectedPage>
  );
}

export default TodayDashboard;
