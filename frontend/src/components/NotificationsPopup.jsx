import React, { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, BookOpen, TrendingDown, CheckCircle, MessageSquare, Clock, PhoneMissed, Calendar as CalendarIcon, Users, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPopup({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications?limit=20');
        if (res.data?.success) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EXAM_ALERT': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'ASSIGNMENT_DUE': return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'BUDGET_WARNING': return <TrendingDown className="w-5 h-5 text-yellow-500" />;
      case 'HABIT_REMINDER': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'GROUP_MESSAGE': return <Users className="w-5 h-5 text-indigo-500" />;
      case 'NEW_MESSAGE': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'MISSED_CALL': return <PhoneMissed className="w-5 h-5 text-rose-500" />;
      case 'CALENDAR_REMINDER': return <CalendarIcon className="w-5 h-5 text-indigo-500" />;
      case 'AI_BRIEFING': return <Clock className="w-5 h-5 text-purple-500" />;
      case 'FRIEND_REQUEST': return <UserPlus className="w-5 h-5 text-pink-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-3 w-[400px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[85vh]">
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-white custom-scrollbar">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-50 h-24 rounded-2xl w-full border border-slate-100"></div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  if (notif.type === 'FRIEND_REQUEST') {
                    navigate('/messages');
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border ${!notif.read ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'} flex gap-4 transition-all hover:border-slate-300 ${notif.type === 'FRIEND_REQUEST' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${!notif.read ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-slate-900 text-[15px] leading-tight">
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mt-1.5 leading-snug pr-2">{notif.message}</p>
                  <p className="text-[13px] text-slate-400 mt-2 font-medium">
                    {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Bell className="w-12 h-12 mb-3 text-slate-300" />
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl text-center">
        <Link 
          to="/notifications"
          onClick={onClose}
          className="text-blue-500 hover:text-blue-700 font-semibold text-[15px] transition-colors inline-block"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
