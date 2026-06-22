import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, AlertCircle, BookOpen, TrendingDown, 
  CheckCircle, MessageSquare, Clock, PhoneMissed, 
  Calendar as CalendarIcon, Trash2, CheckCircle2, Users, UserPlus
} from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const fetchNotifications = async (pageNum, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/notifications/all?page=${pageNum}&limit=20`);
      if (res.data?.success) {
        if (append) {
          setNotifications(prev => [...prev, ...res.data.notifications]);
        } else {
          setNotifications(res.data.notifications);
        }
        setTotalPages(res.data.totalPages || 1);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchNotifications(page + 1, true);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
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
      default: return <Bell className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" /> 
              Notification History
            </h1>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-200 dark:border-blue-800"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notifications yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                When you get notifications for messages, calls, or study reminders, they'll show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => {
                    if (!notif.read) markAsRead(notif._id);
                    if (notif.type === 'FRIEND_REQUEST') {
                      navigate('/messages');
                    }
                  }}
                  className={`p-5 flex gap-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${notif.type === 'FRIEND_REQUEST' ? 'cursor-pointer' : ''} ${
                    !notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    !notif.read ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-semibold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => deleteNotification(notif._id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mt-1 mr-8">
                      {notif.message}
                    </p>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 font-medium">
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page < totalPages && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
