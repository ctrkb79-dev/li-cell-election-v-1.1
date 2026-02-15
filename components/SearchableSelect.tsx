import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Loader2 } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  descriptions?: Record<string, string>;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "নির্বাচন করুন",
  disabled = false,
  className = "",
  isLoading = false,
  descriptions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (value) {
          setSearchTerm(value);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearchTerm(opt);
    setIsOpen(false);
  };
  
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    const input = wrapperRef.current?.querySelector('input');
    if (input) input.focus();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        scrollIntoView(highlightedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        scrollIntoView(highlightedIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredOptions.length > 0) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm(value);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const scrollIntoView = (index: number) => {
    if (listRef.current) {
      const element = listRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className={`
          relative flex items-center w-full bg-gray-50 border border-gray-300 rounded-lg 
          focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
        `}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full p-2.5 text-sm text-gray-900 bg-transparent border-none outline-none rounded-lg
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 size={16} className="text-green-600 animate-spin" />
          ) : (
            <>
              {value && !disabled && (
                <button 
                  type="button"
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-red-500 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
              <ChevronDown size={16} className="text-gray-400 pointer-events-none" />
            </>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                className={`
                  px-4 py-2 text-sm cursor-pointer transition-colors border-b border-gray-50 last:border-none
                  ${idx === highlightedIndex ? 'bg-green-100 text-green-900' : ''}
                  ${opt === value ? 'bg-green-50' : ''}
                  hover:bg-green-50
                `}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handleSelect(opt)}
              >
                <div className={`font-medium ${opt === value ? 'text-green-700' : 'text-gray-700'}`}>
                    {opt}
                </div>
                {descriptions && descriptions[opt] && (
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {descriptions[opt]}
                    </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              কোনো ফলাফল পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;