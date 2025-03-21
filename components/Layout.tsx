import React, { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="pb-[72px] md:pb-0">
        {children}
      </div>
    </div>
  );
} 