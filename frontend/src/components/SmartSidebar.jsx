import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import QuickCapture from './QuickCapture';
import MessagesPopup from './MessagesPopup';
import { useFocusTimer } from '../context/FocusTimerContext';
import { Clock } from 'lucide-react';

export default function SmartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isActive, timeLeft } = useFocusTimer();

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const fetchUnread = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/users/unread-count');
        if (data && data.count !== undefined) {
          setUnreadCount(data.count);
        }
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        withCredentials: true
      });

      socket.on('newMessage', (msg) => {
        // If messages popup is not open, increment badge
        if (!showMessages) {
          setUnreadCount(prev => prev + 1);
        }
      });
      socket.on('message:receive', (msg) => {
        if (!showMessages) {
          setUnreadCount(prev => prev + 1);
        }
      });
      socket.on('friend:request', (msg) => {
        if (!showMessages) {
          setUnreadCount(prev => prev + 1);
        }
      });

      return () => socket.disconnect();
    }
  }, [showMessages]);

  const handleOpenMessages = () => {
    setShowMessages(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Translucent Bar / Pull Handle */}
      <div 
        className={`fixed top-1/2 right-0 -translate-y-1/2 flex items-center z-50 transition-transform duration-300 ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="h-32 w-6 bg-indigo-500/30 hover:bg-indigo-500/50 backdrop-blur-md rounded-l-xl flex items-center justify-center cursor-pointer border-y border-l border-white/20 shadow-[-2px_0_10px_rgba(0,0,0,0.1)] transition-all hover:w-8 group pr-1"
          aria-label="Open Sidebar"
        >
          <ChevronLeft className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Invisible backdrop to close on click outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-20 sm:w-24 bg-white/80 backdrop-blur-lg border-l border-white/40 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col items-center py-8 gap-6 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 w-2 h-32 bg-indigo-500/10 hover:bg-indigo-500/50 backdrop-blur-md rounded-l-xl flex items-center justify-center cursor-pointer transition-all opacity-0 hover:opacity-100 hover:w-6 group"
          aria-label="Close Sidebar"
        >
          <ChevronRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="flex flex-col gap-6 mt-10">
          <button 
            onClick={() => { setShowQuickCapture(true); setIsOpen(false); }}
            className="w-14 h-14 bg-white text-slate-600 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:scale-110 hover:shadow-md transition-all focus:outline-none"
            title="Quick Capture"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleOpenMessages}
            className="w-14 h-14 bg-white text-slate-600 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-md transition-all focus:outline-none relative"
            title="Messages"
          >
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-white text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isActive && (
            <div 
              className="mt-4 flex flex-col items-center justify-center gap-1 w-14 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 animate-in fade-in zoom-in"
              title="Focus Mode Active"
            >
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-bold font-mono tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Popups */}
      {showQuickCapture && (
        <QuickCapture isOpen={showQuickCapture} onClose={() => setShowQuickCapture(false)} isPopupMode={true} />
      )}
      
      {showMessages && (
        <MessagesPopup 
          isOpen={showMessages} 
          onClose={() => {
            setShowMessages(false);
            fetchUnread();
          }} 
        />
      )}
    </>
  );
}
