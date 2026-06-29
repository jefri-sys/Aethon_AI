import React, { useState, useEffect } from 'react';

export default function AppSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('synapse_splash_shown');
    if (hasShown) {
      setVisible(false);
      return;
    }

    sessionStorage.setItem('synapse_splash_shown', 'true');
    const timer = setTimeout(() => {
      setVisible(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="mobile-shell fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--mobile-bg)]">
      <div className="flex flex-col items-center animate-pulse">
        {/* Placeholder for Synapse logo - using pwa-192x192.png or similar */}
        <img src="/pwa-192x192.png" alt="Synapse Logo" className="w-24 h-24 rounded-2xl shadow-md" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: 'var(--mobile-text-primary)' }}>
          Synapse
        </h1>
      </div>
    </div>
  );
}
