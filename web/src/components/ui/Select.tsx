'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string; hint?: string; disabled?: boolean };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Accessible name when there's no visible <label htmlFor={id}> */
  'aria-label'?: string;
  /** Id of the trigger button, so an external <label htmlFor> can point at it */
  id?: string;
  /** Name for a hidden input, for plain form submissions */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Marks the field invalid (red edge) and links it to an error message */
  invalid?: boolean;
  'aria-describedby'?: string;
  /** Wrapper classes (width, margins) */
  className?: string;
  /** Extra classes for the default field-style trigger */
  buttonClassName?: string;
  /** Lay options out as a grid, e.g. 4 for class numbers */
  columns?: number;
  /** Fully custom trigger content (the trigger button still handles behaviour) */
  renderTrigger?: (state: { open: boolean; selected?: SelectOption }) => ReactNode;
  /** Classes for the trigger when renderTrigger is used */
  triggerClassName?: string;
  /** Align the menu to the trigger's left (default) or right edge */
  align?: 'left' | 'right';
  /** Min width of the menu in px (defaults to the trigger width) */
  menuMinWidth?: number;
};

/**
 * Pencil-box dropdown: outlined trigger, card menu with pop shadow, sun highlight
 * on the selected option. Listbox pattern with full keyboard support
 * (arrows, Home/End, type-ahead, Enter/Space, Escape, Tab).
 */
export default function Select({
  value,
  onChange,
  options,
  id,
  name,
  placeholder = 'Choose…',
  disabled,
  required,
  invalid,
  className = '',
  buttonClassName = '',
  columns = 1,
  renderTrigger,
  triggerClassName = '',
  align = 'left',
  menuMinWidth,
  ...aria
}: SelectProps) {
  const autoId = useId();
  const triggerId = id || `select-${autoId}`;
  const listId = `${triggerId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabled = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return i;
    return -1;
  };

  const openMenu = useCallback(
    (at?: number) => {
      if (disabled) return;
      setOpen(true);
      setActive(at ?? (selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, selectedIndex, options],
  );

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
  };

  // The menu is rendered in a portal (so no parent stacking context or overflow
  // can cover or clip it) and positioned against the trigger. It flips upward
  // when there isn't room below, and follows the trigger on scroll/resize.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number; width: number } | null>(null);
  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    setDropUp(up);
    setPos({
      ...(up ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
      ...(align === 'right' ? { right: window.innerWidth - r.right } : { left: r.left }),
      width: r.width,
    });
  }, [align]);
  useLayoutEffect(() => {
    if (!open) return;
    place();
    listRef.current?.focus({ preventScroll: true });
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const move = (step: number) => {
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + step + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  };

  const onTypeahead = (key: string) => {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 600 ? key : t.text + key;
    t.at = now;
    const q = t.text.toLowerCase();
    const start = Math.max(active, 0);
    const order = [...options.slice(start + 1), ...options.slice(0, start + 1)];
    const hit = order.find((o) => !o.disabled && o.label.toLowerCase().startsWith(q));
    if (hit) {
      const idx = options.indexOf(hit);
      if (open) setActive(idx);
      else onChange(hit.value);
    }
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openMenu(e.key === 'ArrowUp' ? firstEnabled(options.length - 1, -1) : undefined);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      onTypeahead(e.key);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const cols = Math.max(1, columns);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(cols);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-cols);
        break;
      case 'ArrowRight':
        if (cols > 1) {
          e.preventDefault();
          move(1);
        }
        break;
      case 'ArrowLeft':
        if (cols > 1) {
          e.preventDefault();
          move(-1);
        }
        break;
      case 'Home':
        e.preventDefault();
        setActive(firstEnabled(0, 1));
        break;
      case 'End':
        e.preventDefault();
        setActive(firstEnabled(options.length - 1, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) onTypeahead(e.key);
    }
  };

  const fieldTrigger =
    'w-full flex items-center justify-between gap-2 h-12 pl-[14px] pr-3 rounded-md border-2 bg-card text-left text-base transition-[border-color,box-shadow] duration-150 ' +
    (invalid ? 'border-danger ' : 'border-border hover:border-edge ') +
    (open ? '!border-edge shadow-[3px_3px_0_0_var(--primary)] ' : '') +
    'focus-visible:outline-none focus-visible:border-edge focus-visible:shadow-[3px_3px_0_0_var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div ref={wrapRef} className={`relative ${renderTrigger ? 'inline-block' : 'block'} ${className}`}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-label={aria['aria-label']}
        aria-describedby={aria['aria-describedby']}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        className={renderTrigger ? triggerClassName : `${fieldTrigger} ${buttonClassName}`}
      >
        {renderTrigger ? (
          renderTrigger({ open, selected })
        ) : (
          <>
            <span className={`truncate ${selected ? 'text-foreground' : 'text-muted-light'}`}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown
              aria-hidden
              size={18}
              strokeWidth={2.5}
              className={`shrink-0 text-muted transition-transform duration-200 ease-pop ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open && pos && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={triggerId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onKeyDown={onListKey}
          style={{
            position: 'fixed',
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            right: pos.right,
            width: renderTrigger ? undefined : pos.width,
            minWidth: menuMinWidth ?? (renderTrigger ? 180 : undefined),
            gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
            transformOrigin: dropUp ? 'bottom' : 'top',
          }}
          className={`z-[70] max-h-72 overflow-auto card-premium p-1.5 animate-menu outline-none text-base font-normal tracking-normal leading-normal text-foreground ${
            columns > 1 ? 'grid gap-1' : 'flex flex-col gap-0.5'
          }`}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === value;
            const isActive = i === active;
            return (
              <li
                key={opt.value || `__empty-${i}`}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex items-center gap-2 rounded-[10px] cursor-pointer select-none transition-colors duration-100 ${
                  columns > 1 ? 'justify-center h-11 px-2 font-bold' : 'min-h-[42px] px-3'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${
                  isSel
                    ? 'bg-sun text-ink font-bold'
                    : isActive
                      ? 'bg-muted-extra-light'
                      : ''
                } ${isActive && isSel ? 'ring-2 ring-edge ring-inset' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {opt.label}
                  {opt.hint && <span className="block text-xs text-muted font-normal truncate">{opt.hint}</span>}
                </span>
                {columns === 1 && isSel && <Check aria-hidden size={16} strokeWidth={3} className="shrink-0" />}
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}
