import type { InputHTMLAttributes } from 'react';

/** Number input with a fixed ₹ prefix. Pass the usual input props. */
export default function PriceInput({
  className = '',
  size = 'md',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & { size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-muted ${big ? 'text-2xl' : 'text-lg'}`}
        aria-hidden
      >
        ₹
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        {...props}
        className={`w-full ${big ? 'h-16 pl-11 text-2xl font-extrabold' : 'min-h-[48px] pl-10'} tabular-nums ${className}`}
      />
    </div>
  );
}
