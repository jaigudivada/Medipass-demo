import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors';

  const variants = {
    default: 'bg-blue-50 text-blue-700 border border-blue-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-white text-slate-700 border border-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200'
  };

  return <span className={clsx(base, variants[variant], className)}>{children}</span>;
};
