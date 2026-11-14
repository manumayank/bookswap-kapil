/* eslint-disable @next/next/no-img-element */
import { BookOpen, PencilRuler } from 'lucide-react';

const FILLS = ['bg-primary', 'bg-secondary', 'bg-sun', 'bg-accent'];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZES = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

/**
 * Square listing thumbnail. With a photo: object-cover. Without: a flat brand
 * colour picked from the id with an outlined book (or stationery) glyph.
 */
export default function ListingThumb({
  id,
  imageUrl,
  category,
  size = 'md',
  className = '',
}: {
  id: string;
  imageUrl?: string | null;
  category?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Glyph = category === 'STATIONERY' ? PencilRuler : BookOpen;
  return (
    <div
      className={`${SIZES[size]} shrink-0 overflow-hidden rounded-md border-2 border-edge ${
        imageUrl ? 'bg-muted-extra-light' : FILLS[hash(id || 'x') % FILLS.length]
      } flex items-center justify-center ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Glyph className="text-ink" size={size === 'lg' ? 36 : size === 'md' ? 26 : 20} strokeWidth={2.25} aria-hidden="true" />
      )}
    </div>
  );
}
