import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, CheckCircle } from 'lucide-react';

export default function UpdateAvailableToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // console.log('SW Registered');
    },
    onRegisterError(error) {
      // console.error('SW registration error', error);
    },
  });

  const [showOfflineReadyToast, setShowOfflineReadyToast] = useState(false);

  useEffect(() => {
    if (offlineReady) {
      const hasSeen = localStorage.getItem('synapse_offline_ready_seen');
      if (!hasSeen) {
        setShowOfflineReadyToast(true);
        localStorage.setItem('synapse_offline_ready_seen', 'true');
        const timer = setTimeout(() => {
          setShowOfflineReadyToast(false);
          setOfflineReady(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !showOfflineReadyToast) return null;

  return (
    <div className="fixed top-14 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {needRefresh && (
        <Card className="flex items-center gap-3 p-4 shadow-xl pointer-events-auto bg-surface-raised border-surface-border">
          <div className="flex-1 text-sm text-text-primary">
            A new version of Synapse is available
          </div>
          <Button size="sm" onClick={() => updateServiceWorker(true)} className="bg-brand-primary text-white border-0 hover:bg-brand-primary-hover">
            Refresh
          </Button>
          <button onClick={() => setNeedRefresh(false)} className="p-1 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0 border-0 bg-transparent cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </Card>
      )}

      {showOfflineReadyToast && !needRefresh && (
        <Card className="flex items-center gap-3 p-4 shadow-xl pointer-events-auto bg-surface-raised border-surface-border">
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--status-success, #1A9E6B)' }} />
          <div className="flex-1 text-sm text-text-primary">
            Synapse is ready to work offline
          </div>
        </Card>
      )}
    </div>
  );
}
