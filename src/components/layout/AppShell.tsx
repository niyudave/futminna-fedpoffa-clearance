import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { NotificationToast } from '@/src/components/notifications/NotificationToast';
import { NotificationCentreModal } from '@/src/components/notifications/NotificationCentreModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-app)] text-[var(--text-primary)] transition-colors duration-200 antialiased selection:bg-[#F3EAF8] selection:text-[#2E0854] dark:selection:bg-[#3D1A68] dark:selection:text-[#E8DAFF]">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
      {/* Universal Real-Time Notification Modals & Toasts */}
      <NotificationToast />
      <NotificationCentreModal />
    </div>
  );
};
