import React from 'react';
import { AppHeader } from './AppHeader';

export interface PageContainerProps {
  children: React.ReactNode;
  roleName?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, roleName }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <AppHeader roleName={roleName} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
