import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 flex items-center justify-between focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
      >
        <span className={selectedOption ? 'font-medium text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1 text-xs">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors',
                  isSelected && 'bg-blue-50 text-blue-700 font-semibold'
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
