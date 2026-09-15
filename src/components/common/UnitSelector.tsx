import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Plus } from 'lucide-react';

export const COMMON_UNITS = [
  'NOS',
  'PCS',
  'PIECE',
  'MTR',
  'MM',
  'CM',
  'INCH',
  'FEET',
  'FT',
  'KG',
  'G',
  'MT',
  'TON',
  'LTR',
  'ML',
  'SQM',
  'SQFT',
  'SQIN',
  'SET',
  'PAIR',
  'BOX',
  'PACK',
  'LOT',
  'ROLL',
  'BUNDLE',
  'LENGTH',
  'DOZEN',
] as const;

interface UnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onEnterNext?: () => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  value,
  onChange,
  onEnterNext,
  id,
  placeholder = 'PCS',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean }>({
    top: 0,
    left: 0,
    width: 120,
    openUpwards: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update floating coordinates when opening or scrolling
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownMaxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownMaxHeight && rect.top > dropdownMaxHeight;

    setCoords({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 130),
      openUpwards,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      // If scroll happens inside the dropdown itself, don't close or jump
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsSearching(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Options to display:
  // If user is actively typing, filter by searchText. Otherwise, show all 27 options!
  const query = isSearching ? searchText.trim().toUpperCase() : '';
  const filteredUnits = query
    ? COMMON_UNITS.filter((u) => u.includes(query))
    : [...COMMON_UNITS];

  // If the current value is custom (not in COMMON_UNITS) and not searching, prepend or include it
  const isCurrentValueCustom = value && !COMMON_UNITS.includes(value as any);
  const displayUnits = [...filteredUnits];
  if (isCurrentValueCustom && !query && !displayUnits.includes(value as any)) {
    displayUnits.unshift(value as any);
  }

  // Check if user is typing a custom unit that is not in the list
  const showCustomOption = query && !filteredUnits.some((u) => u === query);

  const handleSelect = (unit: string) => {
    onChange(unit.toUpperCase());
    setIsOpen(false);
    setIsSearching(false);
    setSearchText('');
  };

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
    setIsSearching(false);
    setSearchText('');

    // Pre-highlight the current value
    const idx = displayUnits.findIndex((u) => u === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        handleOpen();
      } else {
        const max = showCustomOption ? displayUnits.length : displayUnits.length - 1;
        setHighlightedIndex((prev) => (prev < max ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        handleOpen();
      } else {
        const max = showCustomOption ? displayUnits.length : displayUnits.length - 1;
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : max));
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (showCustomOption && highlightedIndex === displayUnits.length) {
          handleSelect(query);
        } else if (displayUnits[highlightedIndex]) {
          handleSelect(displayUnits[highlightedIndex]);
        } else if (query) {
          handleSelect(query);
        } else {
          setIsOpen(false);
        }
        onEnterNext?.();
      } else {
        onEnterNext?.();
      }
    } else if (e.key === 'Tab') {
      if (isOpen) {
        if (isSearching && query) {
          onChange(query);
        }
        setIsOpen(false);
        setIsSearching(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsSearching(false);
    }
  };

  return (
    <div ref={triggerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={isSearching ? searchText : value}
          onChange={(e) => {
            const nextVal = e.target.value.toUpperCase();
            setSearchText(nextVal);
            setIsSearching(true);
            onChange(nextVal);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            handleOpen();
          }}
          onClick={() => {
            if (!isOpen) handleOpen();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-white border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg pl-2.5 pr-6 py-2 text-xs font-semibold text-slate-800 outline-none uppercase transition-all ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen) {
              setIsOpen(false);
              setIsSearching(false);
            } else {
              handleOpen();
              inputRef.current?.focus();
            }
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
          title="Toggle units list"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-600' : ''}`}
          />
        </button>
      </div>

      {/* Floating Dropdown Menu rendered via Portal to prevent table clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? undefined : `${coords.top}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            {/* Header label */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Select Unit</span>
              <span className="font-mono text-[9px] text-slate-400 font-normal">
                {displayUnits.length} units
              </span>
            </div>

            {/* Scrollable List of Units */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1 text-xs overscroll-contain">
              {displayUnits.map((u, idx) => {
                const isSelected = u === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={u}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before click fires
                      handleSelect(u);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-red-50 text-red-700 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono tracking-wide">{u}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                  </button>
                );
              })}

              {/* Custom Unit Option if user typed something not in list */}
              {showCustomOption && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(query);
                  }}
                  onMouseEnter={() => setHighlightedIndex(displayUnits.length)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border-t border-slate-100 mt-1 ${
                    highlightedIndex === displayUnits.length
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'bg-slate-50 hover:bg-red-50 text-red-600'
                  }`}
                >
                  <Plus className="w-3 h-3 text-red-600" />
                  <span className="truncate">
                    Use custom: <strong className="font-mono font-bold text-slate-900">"{query}"</strong>
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
