// Small display helpers shared by listing cards, browse and listing detail.

// Shown (in black and white) when a listing has no photo. Unsplash License photo
// by Kelsy Gagnebin: https://unsplash.com/photos/jcD8lXN27Xs
export const NO_PHOTO_IMG =
  'https://images.unsplash.com/photo-1686161238569-f32e92b6c363?auto=format&fit=crop&w=800&h=600&q=60';
export const NO_PHOTO_CLASS = 'grayscale contrast-[1.05] brightness-[1.02]';

export function formatRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

// Flat cover colours for listings without a photo. Sun and secondary stay
// light in both themes, and the glyph is drawn in ink, so all four read well.
const COVER_TONES = ['bg-primary', 'bg-secondary', 'bg-sun', 'bg-accent'] as const;

export function coverTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COVER_TONES[Math.abs(hash) % COVER_TONES.length];
}
