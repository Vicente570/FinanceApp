import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface AppleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export function AppleSelect({ value, onChange, options, placeholder, className = '' }: AppleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full border rounded-lg px-4 py-0.5 text-left font-medium text-sm focus:outline-none transition-all duration-200 flex items-center justify-between bg-white text-gray-900 border-gray-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
      >
        <span className="text-gray-900 group-hover:text-white flex items-center">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className="w-3 h-3 text-gray-400 group-hover:text-white transition-all duration-200" 
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-40 w-full top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2">
            {[
              ...(selectedOption ? [selectedOption] : []),
              ...options.filter(option => option.value !== value)
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`group w-full h-6 px-2 py-0 text-left font-medium text-sm leading-5 focus:outline-none transition-colors duration-150 rounded-md relative flex items-center hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white ${
                  option.value === value 
                    ? 'text-gray-800' 
                    : 'text-gray-800'
                }`}
              >
                <span className="flex items-center flex-1 min-w-0">
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="ml-2 text-lg flex-shrink-0">•</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 