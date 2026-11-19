// src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-bar and save prompt for 1-click install
      e.preventDefault();
      window.deferredPrompt = e;
      console.log('[PWA] Native install prompt captured and ready.');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.deferredPrompt = null;
      console.log('[PWA] LangBridge successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    // 1. Direct native browser install prompt
    let promptEvent = window.deferredPrompt;

    if (!promptEvent) {
      // If event was slightly delayed during initial page load, wait up to 800ms
      promptEvent = await new Promise((resolve) => {
        const handler = (e) => {
          e.preventDefault();
          window.deferredPrompt = e;
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        setTimeout(() => {
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(window.deferredPrompt);
        }, 800);
      });
    }

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log('[PWA] User choice outcome:', choice.outcome);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          window.deferredPrompt = null;
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
    } else {
      console.log('[PWA] Browser did not expose deferredPrompt. Use address bar install icon.');
    }
  };

  return {
    isInstalled,
    promptInstall,
  };
}
