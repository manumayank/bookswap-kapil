import Link from 'next/link';

interface BookCardProps {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  imageUrl?: string;
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
}: BookCardProps) {
  const savings = buyingPrice ? buyingPrice - sellingPrice : 0;

  return (
    <Link href={`/listings/${id}`} className="group card-premium overflow-hidden">
      <div className="relative aspect-[4/5] bg-muted-extra-light overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-primary/5">
            <div className="w-20 h-20 rounded-[28px] bg-white flex items-center justify-center text-primary text-3xl shadow-sm mb-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              {category === 'Stationery' ? '\u270F\uFE0F' : '\uD83D\uDCDA'}
            </div>
            <span className="text-muted-light text-[10px] font-black uppercase tracking-[0.2em]">{category}</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="badge badge-primary glass backdrop-blur-md">{condition}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3 gap-4">
          <h3 className="font-extrabold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-xl text-foreground">
              {'\u20B9'}{sellingPrice}
            </span>
            {buyingPrice && buyingPrice > sellingPrice && (
              <span className="text-xs text-muted line-through">
                {'\u20B9'}{buyingPrice}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span className="badge badge-secondary">
              Save {'\u20B9'}{savings}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-card-border">
          <div className="w-8 h-8 rounded-xl bg-muted-extra-light flex items-center justify-center text-[10px] font-black text-muted uppercase tracking-widest border border-card-border">
            {city?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-foreground text-xs font-bold leading-none mb-1">{city}</p>
            <p className="text-muted-light text-[10px] font-medium uppercase tracking-tighter">Location</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
