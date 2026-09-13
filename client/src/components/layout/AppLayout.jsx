import React from 'react';
import { NavigationBar } from './NavigationBar';
import { ConnectionBanner } from './ConnectionBanner';
import { CommandPalette } from '../common/CommandPalette';
import { ToastContainer } from '../common/Toast';
import { Lightbox } from '../common/Lightbox';

export const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-dark-950 text-slate-100 overflow-hidden select-none">
      <ConnectionBanner />
      <div className="flex flex-1 overflow-hidden relative">
        <NavigationBar />
        <main className="flex-1 flex overflow-hidden relative bg-dark-900">
          {children}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <CommandPalette />
      <ToastContainer />
      <Lightbox />
    </div>
  );
};
