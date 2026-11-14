import { Caveat } from 'next/font/google';

// Handwriting face for notebook annotations on /initiative only.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

export const hand = caveat.className;
