import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Wallet, Flame, Briefcase, Compass, Settings, Bell, Users, Brain, Edit3 } from 'lucide-react';
import api from '../../services/api';

export default function MoreMenu({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        try {
          const response = await api.get('/notifications?limit=1');
          if (response.data && response.data.success) {
            setUnreadCount(response.data.unreadCount || 0);
          }
        } catch (error) {
          console.error('Failed to fetch notifications unread count:', error);
        }
      };
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const tiles = [
    { label: 'Synapse AI', path: '/ai-mobile', icon: Brain, bg: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)' },
    { label: 'Notes', path: '/notes-mobile', icon: Edit3, bg: 'var(--mobile-secondary-subtle)', color: 'var(--mobile-secondary)' },
    { label: 'Notebook', path: '/notebook-mobile', icon: BookOpen, bg: 'var(--mobile-secondary-subtle)', color: 'var(--mobile-secondary)' },
    { label: 'Finance', path: '/finance-mobile', icon: Wallet, bg: 'var(--mobile-success-subtle)', color: 'var(--mobile-success)' },
    { label: 'Habits', path: '/habits-mobile', icon: Flame, bg: 'var(--mobile-warning-subtle)', color: 'var(--mobile-warning)' },
    { label: 'Career Vault', path: '/career-mobile', icon: Briefcase, bg: 'var(--mobile-secondary-subtle)', color: 'var(--mobile-secondary)' },
    { label: 'Resource Explorer', path: '/resources-mobile', icon: Compass, bg: 'var(--mobile-border)', color: 'var(--mobile-text-secondary)' },
    { label: 'Study Groups', path: '/groups', icon: Users, bg: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)' },
    { label: 'Settings', path: '/settings-mobile', icon: Settings, bg: 'var(--mobile-surface-raised)', color: 'var(--mobile-text-secondary)' },
    { 
      label: 'Notifications', 
      path: '/notifications-mobile', 
      icon: Bell, 
      bg: 'var(--mobile-danger-subtle)', 
      color: 'var(--mobile-danger)',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null
    },
  ];

  return (
    <div className="mobile-shell">
      <div 
        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div 
        className="fixed bottom-0 left-0 right-0 z-[120] flex flex-col p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom"
        style={{
          backgroundColor: 'var(--mobile-surface)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          maxHeight: '75vh',
        }}
      >
        <div className="flex justify-center mb-6 shrink-0">
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: 'var(--mobile-border)' }} />
        </div>
        
        <h2 
          className="mb-5 shrink-0"
          style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--mobile-text-primary)' 
          }}
        >
          More
        </h2>
        
        <div className="grid grid-cols-2 gap-4 overflow-y-auto" style={{ paddingBottom: '10px' }}>
          {tiles.map((tile) => (
            <button
              key={tile.label}
              onClick={() => handleNav(tile.path)}
              className="flex items-center gap-3 p-4 text-left transition-transform active:scale-95 relative"
              style={{
                backgroundColor: 'var(--mobile-surface-raised)',
                borderRadius: '16px',
                boxShadow: '0px 2px 8px rgba(43,37,32,0.06)'
              }}
            >
              <div 
                className="relative flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: tile.bg,
                  color: tile.color
                }}
              >
                <tile.icon size={20} />
                {tile.badge && (
                  <span 
                    className="absolute flex items-center justify-center rounded-[999px] text-[10px] font-bold"
                    style={{
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: 'var(--mobile-danger)',
                      color: 'var(--mobile-surface)',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      border: '1.5px solid var(--mobile-surface-raised)'
                    }}
                  >
                    {tile.badge}
                  </span>
                )}
              </div>
              <span 
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--mobile-text-primary)'
                }}
              >
                {tile.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
