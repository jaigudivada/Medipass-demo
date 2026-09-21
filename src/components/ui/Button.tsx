import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors';
    
    const variants = {
      default: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]',
      primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]',
      secondary: 'bg-[#0D9488] text-white hover:bg-[#0F766E] active:bg-[#115E59]',
      outline: 'bg-white border border-[#E2E4E9] text-[#1A1D23] hover:bg-[#F8F9FA] active:bg-[#F1F5F9]',
      ghost: 'bg-transparent text-[#525866] hover:text-[#1A1D23] hover:bg-[#F8F9FA]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
