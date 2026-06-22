import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const FocusTimerContext = createContext();

export const useFocusTimer = () => useContext(FocusTimerContext);

export const FocusTimerProvider = ({ children }) => {
  const { user } = useAuth();
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalHoursToday, setTotalHoursToday] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');

  // When user logs out, reset everything
  useEffect(() => {
    if (!user) {
      setIsActive(false);
      setIsBreak(false);
      setTimeLeft(WORK_TIME);
      setSessionCount(0);
      setTotalHoursToday(0);
      setSelectedSubject('');
    }
  }, [user]);

  // Global timer interval
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);

    if (!isBreak) {
      // Work session complete
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      try {
        const res = await api.post('/focus', {
          subjectId: selectedSubject || null,
          durationMinutes: 25
        });
        if (res.data.totalHoursToday) {
          setTotalHoursToday(res.data.totalHoursToday);
        }
      } catch (err) {
        console.error('Failed to record focus session', err);
      }

      setIsBreak(true);
      if (newSessionCount % 4 === 0) {
        setTimeLeft(LONG_BREAK);
      } else {
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      // Break complete
      setIsBreak(false);
      setTimeLeft(WORK_TIME);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
  };

  return (
    <FocusTimerContext.Provider value={{
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
    }}>
      {children}
    </FocusTimerContext.Provider>
  );
};
