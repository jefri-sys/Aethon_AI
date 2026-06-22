import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Play, Pause, RefreshCw, Coffee, BookOpen } from 'lucide-react';
import { useFocusTimer } from '../../context/FocusTimerContext';

export default function FocusMode() {
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

  // Circular progress calculations
  const totalTime = isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Focus Mode</h1>
          <p className="mt-2 text-sm text-gray-600">Pomodoro timer to maximize your productivity.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center">
          
          {/* Subject Selector */}
          <div className="w-full max-w-xs mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Focusing on</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <option value="">General Study</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Status Indicator */}
          <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 font-medium text-slate-700">
            {isBreak ? <Coffee className="w-4 h-4 text-orange-500" /> : <BookOpen className="w-4 h-4 text-indigo-500" />}
            {isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? 'Long Break' : 'Short Break') : 'Focus Session'}
          </div>

          {/* Circular Timer */}
          <div className="relative flex items-center justify-center mb-10">
            <svg className="transform -rotate-90 w-[280px] h-[280px]">
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ease-linear ${isBreak ? 'text-orange-400' : 'text-indigo-600'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-6xl font-extrabold tracking-tighter text-gray-900 font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className="mt-2 text-sm font-medium text-gray-500 uppercase tracking-widest">
                Session {(sessionCount % 4) + 1}/4
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="p-4 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              title="Reset Timer"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 px-6 py-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center">
            <p className="text-sm font-medium text-indigo-900/60 uppercase tracking-wide mb-1">Total Study Time Today</p>
            <p className="text-3xl font-bold text-indigo-700">{totalHoursToday} <span className="text-lg font-medium text-indigo-500">hours</span></p>
          </div>

        </div>
      </div>
    </div>
  );
}
