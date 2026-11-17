import type { ReactNode } from 'react';
import { School as SchoolIcon } from 'lucide-react';
import { boardLabel } from '@/lib/labels';

export interface SchoolOption {
  id: string;
  name: string;
  city: string;
  board: string;
}

/**
 * Dropdown panel shown under a school search input. The page owns the search
 * state; this only renders results (or `empty` when there are none).
 */
export default function SchoolSuggestions({
  listId,
  open,
  schools,
  onSelect,
  empty,
}: {
  listId: string;
  open: boolean;
  schools: SchoolOption[];
  onSelect: (school: SchoolOption) => void;
  empty?: ReactNode;
}) {
  if (!open) return null;
  if (schools.length === 0 && !empty) return null;

  return (
    <div
      id={listId}
      className="animate-menu absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-md border-2 border-edge bg-card shadow-pop"
      style={{ transformOrigin: 'top left' }}
    >
      {schools.length > 0 ? (
        <ul role="listbox" aria-label="Matching schools" className="p-1.5">
          {schools.map((school) => (
            <li key={school.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(school)}
                className="flex w-full min-h-[48px] items-start gap-3 rounded-sm px-3 py-2.5 text-left hover:bg-muted-extra-light focus-visible:bg-muted-extra-light"
              >
                <SchoolIcon size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{school.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {school.city && <span className="badge badge-muted">{school.city}</span>}
                    {school.board && <span className="badge badge-primary">{boardLabel(school.board)}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-sm text-muted">{empty}</div>
      )}
    </div>
  );
}
