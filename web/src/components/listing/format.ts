// Small display helpers shared by listing cards, browse and listing detail.

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
