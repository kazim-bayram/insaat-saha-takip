import React, { useEffect, useState } from 'react';

const InstallPrompt: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const navigatorStandalone = (window.navigator as any).standalone === true;
    const storedInstalled =
      typeof window !== 'undefined' && window.localStorage.getItem('pwaInstalled') === 'true';
    return displayModeStandalone || navigatorStandalone || storedInstalled;
  });

  const [installEvent, setInstallEvent] = useState<any | null>(null);

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window as any).MSStream;
  });

  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallEvent(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsVisible(false);
      try {
        window.localStorage.setItem('pwaInstalled', 'true');
      } catch {
        // ignore storage errors
      }
    };

    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const navigatorStandalone = (window.navigator as any).standalone === true;
    if (displayModeStandalone || navigatorStandalone) {
      setIsStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Rule 1: Kill switch for installed or manually closed
  if (isStandalone || !isVisible) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Rule 2: Android/Chrome (beforeinstallprompt available)
  if (installEvent && !isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white p-4 rounded-lg shadow-xl border border-gray-200 flex justify-between items-center gap-3">
        <p className="text-sm text-gray-800">
          Saha Takip sistemini cihazınıza yükleyerek daha hızlı erişin.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            📲 Uygulamayı Yükle
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Kapat"
          >
            ✖
          </button>
        </div>
      </div>
    );
  }

  // Rule 3: iOS/Safari instructions
  if (isIOS && !installEvent) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white p-4 rounded-lg shadow-xl border border-gray-200 flex justify-between items-center gap-3">
        <p className="text-sm text-gray-800">
          📲 Cihazınıza yüklemek için alt menüdeki{' '}
          <span className="font-semibold">Paylaş (Ok)</span> ikonuna basıp{' '}
          <span className="font-semibold">&quot;Ana Ekrana Ekle&quot;</span> seçeneğini kullanın.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Kapat"
        >
          ✖
        </button>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;

