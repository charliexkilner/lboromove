import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen relative">
      <Navbar key={router.locale} />
      <div className="pb-[72px] md:pb-0">
        {children}
      </div>
    </div>
  );
} 