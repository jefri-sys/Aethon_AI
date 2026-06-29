import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Play, Pause, RefreshCw, Coffee, BookOpen } from 'lucide-react';
import { useFocusTimer } from '../../../context/FocusTimerContext';

export default function MobileFocusMode() {
  const [subjects, setSubjects] = useState([]);
  
  const {
    timeLeft,
    isActive,
    isBreak,
    sessionCount,
    totalHoursToday,
    selectedSubject,
    setSelectedSubject,
    toggleTimer,
    resetTimer,
    WORK_TIME,
    SHORT_BREAK,
    LONG_BREAK
  } = useFocusTimer();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  const totalTime = isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME;
  const radius = 110;
  const cxCy = 120;
  const svgSize = 240;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Subject Selector */}
      <div style={{ width: '100%', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
          Focusing on
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={isActive}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '16px', background: 'var(--mobile-surface)',
            border: '1px solid var(--mobile-border)', color: 'var(--mobile-text-primary)', fontSize: '15px',
            fontWeight: 500, outline: 'none'
          }}
        >
          <option value="">General Study</option>
          {subjects.map(sub => (
            <option key={sub._id} value={sub._id}>{sub.name}</option>
          ))}
        </select>
      </div>

      {/* Status Indicator */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
        borderRadius: '999px', background: 'var(--mobile-surface)', marginBottom: '32px' 
      }}>
        {isBreak ? <Coffee size={16} color="var(--mobile-warning)" /> : <BookOpen size={16} color="var(--mobile-primary)" />}
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>
          {isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? 'Long Break' : 'Short Break') : 'Focus Session'}
        </span>
      </div>

      {/* Circular Timer */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: `${svgSize}px`, height: `${svgSize}px` }}>
          <circle
            cx={cxCy}
            cy={cxCy}
            r={radius}
            stroke="var(--mobile-surface)"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx={cxCy}
            cy={cxCy}
            r={radius}
            stroke={isBreak ? "var(--mobile-warning)" : "var(--mobile-primary)"}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '52px', fontWeight: 800, color: 'var(--mobile-text-primary)', letterSpacing: '-1px' }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
            Session {(sessionCount % 4) + 1}/4
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={toggleTimer}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px',
            borderRadius: '24px', background: isActive ? 'var(--mobile-warning)' : 'var(--mobile-primary)',
            color: '#fff', fontSize: '18px', fontWeight: 700, border: 'none',
            boxShadow: isActive ? '0px 8px 24px rgba(245, 158, 11, 0.35)' : '0px 8px 24px rgba(124, 111, 240, 0.35)',
            transition: 'all 0.2s'
          }}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          style={{
            padding: '16px', borderRadius: '20px', background: 'var(--mobile-surface)',
            color: 'var(--mobile-text-secondary)', border: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        width: '100%', padding: '20px', background: 'var(--mobile-primary-subtle)', 
        borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mobile-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Total Study Time Today
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--mobile-primary)' }}>
          {totalHoursToday} <span style={{ fontSize: '16px', fontWeight: 600 }}>hours</span>
        </div>
      </div>
      
    </div>
  );
}
