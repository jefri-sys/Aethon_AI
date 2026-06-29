import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;

    // Desktop / Android Chrome logic
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissedState = localStorage.getItem('synapse_install_prompt_dismissed');
      if (dismissedState) {
        const { timestamp } = JSON.parse(dismissedState);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          return;
        }
      }
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari logic
    if (isIosDevice && !isStandalone) {
      const iosDismissedState = localStorage.getItem('synapse_ios_install_prompt_dismissed');
      if (iosDismissedState) {
        const { timestamp } = JSON.parse(iosDismissedState);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss >= 7) {
          setIsIOS(true);
          setShowPrompt(true);
        }
      } else {
        setIsIOS(true);
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const stateToSave = JSON.stringify({ timestamp: Date.now() });
    if (isIOS) {
      localStorage.setItem('synapse_ios_install_prompt_dismissed', stateToSave);
    } else {
      localStorage.setItem('synapse_install_prompt_dismissed', stateToSave);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none md:bottom-8">
      <Card className="flex items-center gap-4 p-4 shadow-xl max-w-sm w-full bg-surface-raised border border-surface-border pointer-events-auto rounded-lg">
        {isIOS ? (
          <div className="flex-1 text-sm text-text-primary">
            To install: tap the <Share className="inline w-4 h-4 mx-1" /> icon, then <strong>Add to Home Screen</strong>
          </div>
        ) : (
          <>
            <div className="flex-1 text-sm text-text-primary">
              Install <strong>Synapse</strong> for the full experience
            </div>
            <Button size="sm" onClick={handleInstallClick} className="bg-brand-primary hover:bg-brand-primary-hover text-white border-0">
              Install
            </Button>
          </>
        )}
        <button onClick={handleDismiss} className="p-1 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0 border-0 bg-transparent cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </Card>
    </div>
  );
}
