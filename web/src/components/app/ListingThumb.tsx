/* eslint-disable @next/next/no-img-element */
import NoPhotoArt from '@/components/listing/NoPhotoArt';

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
  return (
    <div
      className={`${SIZES[size]} shrink-0 overflow-hidden rounded-md border-2 border-edge ${
        'bg-muted-extra-light'
      } flex items-center justify-center ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <NoPhotoArt />
      )}
    </div>
  );
}
