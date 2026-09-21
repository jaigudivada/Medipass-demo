import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={clsx('bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={clsx('p-5 border-b border-slate-100', className)}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <h3 className={clsx('text-base font-semibold text-slate-900', className)}>{children}</h3>;

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <p className={clsx('text-xs text-slate-500 mt-0.5', className)}>{children}</p>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={clsx('p-5', className)}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={clsx('px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between', className)}>{children}</div>;
