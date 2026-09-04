import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  badge?: string;
  sublabel?: string;
}

interface SearchableComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  allowCustom?: boolean;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select or type...',
  disabled = false,
  required = false,
  helperText,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal searchTerm when external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Normalize options to ComboboxOption shape
  const normalizedOptions: ComboboxOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      opt.value.toLowerCase().includes(term) ||
      (opt.badge && opt.badge.toLowerCase().includes(term)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If allowCustom and user typed something, commit it; otherwise revert if empty
        if (!allowCustom) {
          const match = normalizedOptions.find(
            (o) => o.label.toLowerCase() === searchTerm.toLowerCase()
          );
          if (match) {
            onChange(match.value);
            setSearchTerm(match.label);
          } else {
            setSearchTerm(value || '');
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, allowCustom, normalizedOptions, onChange]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setSearchTerm(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (allowCustom) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (isOpen && filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
        <span>
          {label} {required && <span className="text-rose-400">*</span>}
        </span>
        {options.length > 0 && (
          <span className="text-[10px] text-slate-500 font-normal lowercase">
            {options.length} options
          </span>
        )}
      </label>

      <div
        className={`relative flex items-center w-full bg-slate-800/90 border transition rounded-xl ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg'
            : 'border-slate-700/80 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-800/40' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 pr-2 text-slate-400">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition"
            tabIndex={-1}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-brand-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}

      {/* Dropdown Options Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected =
                opt.value.toLowerCase() === (value || '').toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between transition-colors ${
                    isHighlighted
                      ? 'bg-brand-500/15 text-brand-300'
                      : isSelected
                      ? 'bg-slate-800 text-brand-400 font-medium'
                      : 'text-slate-200 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[11px] text-slate-400 truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opt.badge && (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
              <Search className="w-4 h-4 text-slate-500 mb-0.5" />
              <span>No presets found for "{searchTerm}"</span>
              {allowCustom && searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelect(searchTerm)}
                  className="mt-1 text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline"
                >
                  Use custom "{searchTerm}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
