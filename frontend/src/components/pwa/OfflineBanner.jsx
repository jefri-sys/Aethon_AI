import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showBackOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none mt-2">
      {!isOnline ? (
        <div 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded shadow-md pointer-events-auto"
          style={{ backgroundColor: 'var(--status-warning, #C8780A)' }}
        >
          <WifiOff className="w-4 h-4" />
          You're offline — showing your last saved data
        </div>
      ) : (
        <div 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded shadow-md pointer-events-auto"
          style={{ backgroundColor: 'var(--status-success, #1A9E6B)' }}
        >
          <Wifi className="w-4 h-4" />
          Back online
        </div>
      )}
    </div>
  );
}
