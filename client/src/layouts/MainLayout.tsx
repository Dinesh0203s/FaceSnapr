import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export default function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ErrorBoundary>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        {!hideFooter && <Footer />}
      </ErrorBoundary>
    </div>
  );
}
