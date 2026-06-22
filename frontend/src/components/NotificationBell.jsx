import React, { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, AlertCircle, Calendar, MessageSquare, CheckCircle, TrendingDown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      // Assuming frontend proxy handles /api/ requests or axios interceptor sets base URL
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications?limit=5`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/read-all`, {}, { withCredentials: true });
      setUnreadCount(0);
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
      case 'HABIT_REMINDER': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'GROUP_MESSAGE': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'AI_BRIEFING': return <Clock className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white dark:border-gray-900 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} truncate`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium block"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
