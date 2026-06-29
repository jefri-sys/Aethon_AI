import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, BookOpen, TrendingDown, CheckCircle, MessageSquare, Clock, Calendar as CalendarIcon, Bell } from 'lucide-react';
import api from '../../../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function MobileNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/all?page=1&limit=50`);
      if (res.data?.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
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

  const markAsReadAndNavigate = async (notif) => {
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    switch (notif.type) {
      case 'EXAM_ALERT': 
      case 'CALENDAR_REMINDER':
        navigate('/academics'); break;
      case 'ASSIGNMENT_DUE': navigate('/planner'); break;
      case 'BUDGET_WARNING': navigate('/finance-mobile'); break;
      case 'HABIT_REMINDER': navigate('/habits-mobile'); break;
      case 'GROUP_MESSAGE':
      case 'NEW_MESSAGE':
      case 'FRIEND_REQUEST': navigate('/messages'); break;
      default: break;
    }
  };

  const getStyle = (type) => {
    switch (type) {
      case 'EXAM_ALERT': return { bg: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', Icon: AlertCircle };
      case 'ASSIGNMENT_DUE': return { bg: 'var(--mobile-warning-subtle)', color: 'var(--mobile-warning)', Icon: BookOpen };
      case 'BUDGET_WARNING': return { bg: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', Icon: TrendingDown };
      case 'HABIT_REMINDER': return { bg: 'var(--mobile-success-subtle)', color: 'var(--mobile-success)', Icon: CheckCircle };
      case 'GROUP_MESSAGE': 
      case 'NEW_MESSAGE':
      case 'FRIEND_REQUEST': return { bg: 'rgba(255,122,89,0.1)', color: 'var(--mobile-primary)', Icon: MessageSquare };
      case 'CALENDAR_REMINDER': return { bg: 'var(--mobile-secondary-subtle)', color: 'var(--mobile-secondary)', Icon: CalendarIcon };
      case 'AI_BRIEFING': return { bg: 'var(--mobile-secondary-subtle)', color: 'var(--mobile-secondary)', Icon: Clock };
      default: return { bg: 'var(--mobile-border)', color: 'var(--mobile-text-secondary)', Icon: Bell };
    }
  };

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(40px + env(safe-area-inset-bottom))'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          Notifications
        </h1>
        {notifications.some(n => !n.read) ? (
          <button onClick={markAllAsRead} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-primary)', background: 'none', border: 'none', padding: 0 }}>
            Mark all read
          </button>
        ) : (
          <div style={{ width: '40px' }} />
        )}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px' }}>
            <Bell size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
            <div>No notifications yet.</div>
          </div>
        ) : (
          notifications.map(notif => {
            const { bg, color, Icon } = getStyle(notif.type);
            return (
              <div 
                key={notif._id} 
                onClick={() => markAsReadAndNavigate(notif)}
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '16px 0', 
                  borderBottom: '1px solid var(--mobile-border)',
                  opacity: notif.read ? 0.6 : 1,
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Icon color={color} size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ paddingRight: '8px' }}>{notif.title}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--mobile-text-tertiary)', whiteSpace: 'nowrap' }}>
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', lineHeight: 1.4 }}>
                    {notif.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
