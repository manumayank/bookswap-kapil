'use client';

import { BOARD_OPTIONS, CATEGORY_OPTIONS, boardLabel } from '@/lib/labels';

export interface BrowseFilterValues {
  board: string;
  classLevel: string;
  category: string;
  priceMin: string;
  priceMax: string;
  city: string;
}

export const EMPTY_BROWSE_FILTERS: BrowseFilterValues = {
  board: '',
  classLevel: '',
  category: '',
  priceMin: '',
  priceMax: '',
  city: '',
};

export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const CATEGORY_CHIP: Record<string, string> = { BOOK: 'Textbooks', STATIONERY: 'Stationery' };

const PRICE_PRESETS = [
  { label: 'Under ₹200', max: '200' },
  { label: 'Under ₹500', max: '500' },
  { label: 'Under ₹1,000', max: '1000' },
];

interface Props {
  values: BrowseFilterValues;
  onChange: <K extends keyof BrowseFilterValues>(key: K, value: BrowseFilterValues[K]) => void;
  /** Prefix for input ids so the rail and the phone sheet can both render. */
  idPrefix: string;
}

function GroupLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  const cls = 'mb-3 block text-sm font-semibold text-foreground';
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {children}
    </label>
  ) : (
    <legend className={cls}>{children}</legend>
  );
}

export default function BrowseFilters({ values, onChange, idPrefix }: Props) {
  const toggle = (key: 'board' | 'category' | 'classLevel', value: string) =>
    onChange(key, values[key] === value ? '' : value);

  return (
    <div className="space-y-7">
      <fieldset>
        <GroupLabel>What are you looking for?</GroupLabel>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              className="chip"
              aria-pressed={values.category === cat}
              onClick={() => toggle('category', cat)}
            >
              {CATEGORY_CHIP[cat] ?? cat}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <GroupLabel>Class</GroupLabel>
        <div className="grid grid-cols-6 gap-2">
          {CLASS_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className="chip justify-center px-0"
              aria-pressed={values.classLevel === c}
              aria-label={`Class ${c}`}
              onClick={() => toggle('classLevel', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <GroupLabel>Board</GroupLabel>
        <div className="flex flex-wrap gap-2">
          {BOARD_OPTIONS.map((board) => (
            <button
              key={board}
              type="button"
              className="chip"
              aria-pressed={values.board === board}
              onClick={() => toggle('board', board)}
            >
              {boardLabel(board)}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <GroupLabel htmlFor={`${idPrefix}-city`}>City</GroupLabel>
        <input
          id={`${idPrefix}-city`}
          type="text"
          autoComplete="address-level2"
          value={values.city}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="For example, Bangalore"
          className="w-full"
        />
      </div>

      <fieldset>
        <GroupLabel>Price</GroupLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = values.priceMax === p.max && !values.priceMin;
            return (
              <button
                key={p.max}
                type="button"
                className="chip"
                aria-pressed={active}
                onClick={() => {
                  onChange('priceMin', '');
                  onChange('priceMax', active ? '' : p.max);
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-min`} className="sr-only">
            Minimum price in rupees
          </label>
          <input
            id={`${idPrefix}-min`}
            type="number"
            min={0}
            inputMode="numeric"
            value={values.priceMin}
            onChange={(e) => onChange('priceMin', e.target.value)}
            placeholder="Min ₹"
            className="w-full min-w-0"
          />
          <span className="text-muted" aria-hidden>
            to
          </span>
          <label htmlFor={`${idPrefix}-max`} className="sr-only">
            Maximum price in rupees
          </label>
          <input
            id={`${idPrefix}-max`}
            type="number"
            min={0}
            inputMode="numeric"
            value={values.priceMax}
            onChange={(e) => onChange('priceMax', e.target.value)}
            placeholder="Max ₹"
            className="w-full min-w-0"
          />
        </div>
      </fieldset>
    </div>
  );
}
