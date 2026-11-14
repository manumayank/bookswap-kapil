/**
 * Placeholder artwork for listings without a photo: a monochrome line drawing of
 * a textbook on faint ruled paper, in theme greys (works in light and dark).
 * Fills its parent; decorative only.
 */
export default function NoPhotoArt({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={`h-full w-full bg-muted-extra-light text-muted ${className}`}
    >
      {/* faint ruled lines */}
      <g stroke="currentColor" strokeOpacity="0.14" strokeWidth="2">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1="0" x2="400" y1={36 + i * 30} y2={36 + i * 30} />
        ))}
      </g>
      {/* book group: centred and scaled so the whole book always fits */}
      <g transform="translate(200 150) scale(0.72) translate(-210 -164)">
      {/* soft shadow */}
      <rect x="150" y="96" width="132" height="168" rx="10" fill="currentColor" fillOpacity="0.16" />
      {/* the book */}
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* pages edge */}
        <path d="M268 84 V246 a10 10 0 0 1 -10 10 H150" strokeOpacity="0.55" />
        <path d="M262 90 V240" strokeOpacity="0.35" strokeWidth="3" />
        {/* cover */}
        <rect x="138" y="72" width="124" height="172" rx="10" className="fill-card" />
        {/* spine */}
        <path d="M160 72 V244" />
        {/* title label */}
        <rect x="178" y="102" width="66" height="34" rx="6" />
        <path d="M188 114 H234 M188 125 H220" strokeWidth="4" strokeOpacity="0.7" />
        {/* bookmark ribbon */}
        <path d="M228 72 V104 l9 -8 l9 8 V72" />
        {/* cover lines */}
        <path d="M178 212 H244 M178 226 H226" strokeWidth="4" strokeOpacity="0.5" />
      </g>
      </g>
    </svg>
  );
}
