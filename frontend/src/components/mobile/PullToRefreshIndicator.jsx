import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PullToRefreshIndicator({ isPulling, pullProgress, isRefreshing }) {
  if (!isPulling && !isRefreshing) return null;

  return (
    <div 
      className="mobile-shell absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-200"
      style={{ 
        transform: `translateY(${Math.max((pullProgress * 60) - 60, isRefreshing ? 20 : -60)}px)` 
      }}
    >
      <div 
        className="flex items-center justify-center bg-[var(--mobile-surface)] rounded-full shadow-[0_2px_8px_rgba(43,37,32,0.15)]"
        style={{
          width: '40px',
          height: '40px',
          opacity: isRefreshing ? 1 : Math.max(0.2, pullProgress),
          transform: `scale(${isRefreshing ? 1 : Math.max(0.5, pullProgress)})`
        }}
      >
        <Loader2 
          size={20} 
          className={isRefreshing ? "animate-spin" : ""} 
          style={{ 
            color: 'var(--mobile-primary)',
            transform: isPulling ? `rotate(${pullProgress * 360}deg)` : 'none'
          }} 
        />
      </div>
    </div>
  );
}
