/* eslint-disable @next/next/no-img-element */

type LogoProps = {
  /** "full" = mark + name + tagline, "short" = square mark only */
  variant?: 'full' | 'short';
  /** Rendered height in px; width follows the SVG aspect ratio. */
  height?: number;
  /** "auto" follows prefers-color-scheme; force one when the background never changes. */
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
};

const RATIO = { full: 290 / 80, short: 1 };

export default function Logo({ variant = 'full', height = 40, theme = 'auto', className = '' }: LogoProps) {
  const width = Math.round(height * RATIO[variant]);
  const src = (t: 'light' | 'dark') => `/brand/logo-${variant}-${t}.svg`;
  const alt = variant === 'full' ? 'Sybrary – School Book Exchange' : 'Sybrary';

  if (theme !== 'auto') {
    return <img src={src(theme)} alt={alt} width={width} height={height} className={className} />;
  }

  return (
    <>
      <img src={src('light')} alt={alt} width={width} height={height} className={`dark:hidden ${className}`} />
      <img src={src('dark')} alt={alt} width={width} height={height} className={`hidden dark:block ${className}`} />
    </>
  );
}
