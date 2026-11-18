import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  pill?: boolean;
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  size = 'md',
  pill = false,
  align = 'left',
  direction = 'down',
  className = '',
  triggerClassName = '',
  menuClassName = '',
  ariaLabel,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = Math.min(options.length * 36 + 16, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp =
      direction === 'up' || (spaceBelow < estimatedHeight + 12 && rect.top > estimatedHeight);

    const minMenuWidth = Math.max(rect.width, 168);
    let left = align === 'right' ? rect.right - minMenuWidth : rect.left;
    if (left + minMenuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - minMenuWidth - 12);
    }
    if (left < 12) left = 12;

    setCoords({
      top: shouldOpenUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width: minMenuWidth,
      openUp: shouldOpenUp,
    });
  }, [align, direction, options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  const sizeCls =
    size === 'sm'
      ? 'h-8 px-3 text-xs gap-1.5'
      : 'h-9 px-3.5 text-[13px] gap-2';

  const radiusCls = pill ? 'rounded-full' : 'rounded-lg';

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-between w-full border transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none focus:outline-none ${radiusCls} ${sizeCls} ${
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : open
            ? 'bg-white border-primary-500 ring-2 ring-primary-500/15 text-gray-900'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
        } font-medium ${triggerClassName}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'rotate-180 text-primary-600' : 'text-gray-400'
          }`}
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              transform: coords.openUp ? 'translateY(-100%)' : undefined,
            }}
            className={`${
              coords.openUp ? 'animate-ui-pop-up' : 'animate-ui-pop'
            } bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/90 shadow-[0_16px_38px_-10px_rgba(15,23,42,0.16)] p-1.5 z-[9999] max-h-64 overflow-y-auto space-y-0.5 ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    opt.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary-50 text-primary-700 font-semibold cursor-pointer'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950 hover:translate-x-0.5 font-medium cursor-pointer'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 animate-ui-check" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
