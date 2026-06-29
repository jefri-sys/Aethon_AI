import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, TrendingUp, Wallet, Flame, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

export default function MobileDashboard({ 
  user, 
  data, 
  loading, 
  briefingLoading, 
  briefingLimitHit, 
  toggleTaskStatus 
}) {
  const navigate = useNavigate();
  const { 
    briefing, 
    todayTasks = [], 
    cgpa, 
    budget, 
    habitAnalytics, 
    notifications = [], 
    upcomingDeadlines = [] 
  } = data || {};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const todayDateStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const getPriorityColors = (label) => {
    switch (label) {
      case 'High':
      case 'Critical':
        return { bg: 'var(--mobile-danger-subtle)', text: 'var(--mobile-danger)' };
      case 'Medium':
        return { bg: 'var(--mobile-warning-subtle)', text: 'var(--mobile-warning)' };
      case 'Low':
      default:
        return { bg: 'var(--mobile-success-subtle)', text: 'var(--mobile-success)' };
    }
  };

  const sortedTasks = [...todayTasks].sort((a, b) => {
    const pVal = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const aPri = a.priority || a.priorityLabel || 'Medium';
    const bPri = b.priority || b.priorityLabel || 'Medium';
    return (pVal[bPri] || 0) - (pVal[aPri] || 0);
  });

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* 1. HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0 20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, lineHeight: 1.2 }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mobile-text-secondary)', margin: '4px 0 0 0' }}>
            {todayDateStr}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications-mobile')}>
            <Bell size={22} color="var(--mobile-text-primary)" />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--mobile-danger)',
                color: '#fff',
                height: '16px',
                minWidth: '16px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt="Profile" 
              onClick={() => navigate('/profile')}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--mobile-border)', objectFit: 'cover', cursor: 'pointer' }} 
            />
          ) : (
            <div 
              onClick={() => navigate('/profile')}
              style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid var(--mobile-border)',
              background: 'var(--mobile-secondary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--mobile-secondary)',
              cursor: 'pointer'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px 20px 20px' }}>
        {/* 2. AI BRIEFING CARD */}
        <div style={{
          width: '100%',
          borderRadius: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, var(--mobile-secondary-subtle) 0%, var(--mobile-surface) 100%)',
          boxShadow: 'var(--mobile-shadow-card)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--mobile-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-secondary)' }}>AI Briefing</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 400, color: 'var(--mobile-text-primary)', lineHeight: 1.5, marginTop: '8px', marginBottom: 0 }}>
            {briefingLoading ? 'Loading briefing...' : (briefing || "Your day looks good. Check your tasks below.")}
          </p>
          <div 
            onClick={() => navigate('/planner')}
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-primary)', marginTop: '12px', textAlign: 'right', cursor: 'pointer' }}
          >
            View Plan &rarr;
          </div>
        </div>

        {/* 3. STATS ROW */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* CGPA */}
          <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '14px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <TrendingUp size={16} color="var(--mobile-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginTop: '10px' }}>
              {cgpa !== null ? cgpa : '—'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>
              CGPA
            </div>
          </div>
          {/* Budget */}
          <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '14px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Wallet size={16} color="var(--mobile-primary)" style={{ marginBottom: '6px' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>
              {budget !== null ? `₹${budget}` : '—'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>
              Budget Left
            </div>
          </div>
          {/* Streak */}
          <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '14px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Flame size={16} color="#F2A93B" style={{ marginBottom: '6px' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>
              {habitAnalytics?.bestStreak || '0'} days
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>
              Streak
            </div>
          </div>
        </div>

        {/* 4. TODAY'S TASKS CARD */}
        <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-text-primary)', margin: 0 }}>Today's Tasks</h2>
            <div onClick={() => navigate('/planner')} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-primary)', cursor: 'pointer' }}>See all &rarr;</div>
          </div>
          {sortedTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sortedTasks.map((task, idx) => {
                const isCompleted = task.status === 'Completed';
                const taskPriority = task.priority || task.priorityLabel || 'Medium';
                const pColor = getPriorityColors(taskPriority);
                return (
                  <div 
                    key={task._id} 
                    onClick={() => navigate('/planner')}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: idx < sortedTasks.length - 1 ? '1px solid var(--mobile-border)' : 'none', cursor: 'pointer' }}
                  >
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task._id, task.status); }}
                      style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: isCompleted ? 'none' : '2px solid var(--mobile-border)',
                        background: isCompleted ? 'var(--mobile-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}
                    >
                      {isCompleted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.6 : 1 }}>
                      {task.title}
                    </div>
                    <div style={{ background: pColor.bg, color: pColor.text, borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                      {taskPriority}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--mobile-text-secondary)', padding: '20px 0' }}>
              No tasks for today 🎉
            </div>
          )}
        </div>

        {/* 5. UPCOMING DEADLINES CARD */}
        <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-text-primary)', margin: '0 0 8px 0' }}>Upcoming</h2>
          {upcomingDeadlines.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcomingDeadlines.slice(0, 5).map((deadline, idx) => {
                const isExam = deadline.type === 'exam';
                const isTask = deadline.type === 'task';
                const diffTime = deadline.date - new Date();
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: idx < Math.min(upcomingDeadlines.length, 5) - 1 ? '1px solid var(--mobile-border)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isExam ? 'var(--mobile-danger-subtle)' : isTask ? 'var(--mobile-warning-subtle)' : 'var(--mobile-info-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isExam ? <Calendar size={16} color="var(--mobile-danger)" /> : isTask ? <FileText size={16} color="var(--mobile-warning)" /> : <Bell size={16} color="var(--mobile-info)" />}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deadline.title}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mobile-text-tertiary)' }}>
                      in {days > 0 ? days : 0} days
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--mobile-text-secondary)', padding: '20px 0' }}>
              No upcoming deadlines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
