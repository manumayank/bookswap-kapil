import Link from 'next/link';
import { BookOpen, PencilRuler } from 'lucide-react';
import { boardLabel, categoryLabel, conditionLabel } from '@/lib/labels';
import { NO_PHOTO_CLASS, NO_PHOTO_IMG, formatRupees } from '@/components/listing/format';

interface BookCardProps {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number | null;
  condition?: string | null;
  category: string;
  city: string;
  imageUrl?: string;
  board?: string | null;
  classLevel?: number | null;
  schoolName?: string | null;
}

export default function BookCard({
  id,
  title,
  sellingPrice,
  buyingPrice,
  condition,
  category,
  city,
  imageUrl,
  board,
  classLevel,
  schoolName,
}: BookCardProps) {
  const savings = buyingPrice && buyingPrice > sellingPrice ? buyingPrice - sellingPrice : 0;
  const isStationery = category === 'STATIONERY';
  const Glyph = isStationery ? PencilRuler : BookOpen;
  const place = [schoolName, city].filter(Boolean).join(', ');

  return (
    <Link
      href={`/listings/${id}`}
      className="group card-premium card-interactive flex h-full flex-col overflow-hidden rounded-lg"
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-edge">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <>
            <img src={NO_PHOTO_IMG} alt="" loading="lazy" className={`h-full w-full object-cover ${NO_PHOTO_CLASS}`} />
            <span className="badge badge-muted absolute right-3 bottom-3 bg-card/90">No photo yet</span>
          </>
        )}

        <span className="sticker absolute left-3 top-3 text-lg leading-tight">
          <span className="sr-only">Price </span>
          {formatRupees(sellingPrice)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug decoration-primary decoration-2 underline-offset-4 group-hover:underline">
          {title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {classLevel ? <span className="badge badge-primary">Class {classLevel}</span> : null}
          {board ? <span className="badge badge-muted">{boardLabel(board)}</span> : null}
          {isStationery && !classLevel ? <span className="badge badge-muted">{categoryLabel(category)}</span> : null}
          {condition ? <span className="badge badge-muted">{conditionLabel(condition)}</span> : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          {place ? <p className="min-w-0 truncate text-sm text-muted">{place}</p> : <span />}
          {savings > 0 && (
            <span className="badge badge-secondary shrink-0">Save {formatRupees(savings)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
