'use client';

import { useState, useEffect } from 'react';
import { WindowsProvider } from '@/context/WindowsContext';
import { AuthProvider } from '@/context/AuthContext';
import Desktop from '@/components/Desktop/Desktop';
import Taskbar from '@/components/Taskbar/Taskbar';
import WelcomePopup from '@/components/WelcomePopup/WelcomePopup';
import BootScreen from '@/components/BootScreen/BootScreen';

export default function Home() {
  const [isBooting, setIsBooting] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
      const welcomeHidden = localStorage.getItem('cacc-welcome-hidden');
      if (!welcomeHidden) {
        setTimeout(() => setShowWelcome(true), 500);
      }
    }, 2500);

    return () => clearTimeout(bootTimer);
  }, []);

  if (isBooting) {
    return <BootScreen />;
  }

  return (
    <AuthProvider>
      <WindowsProvider>
        <Desktop />
        <Taskbar />
        {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      </WindowsProvider>
    </AuthProvider>
  );
}
