import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sans = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Sybrary – give school books a second life',
  description: "Reuse school textbooks. Pass on what your child has outgrown, find next term's books from other parents, and save money and paper.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ebeaf0' },
    { media: '(prefers-color-scheme: dark)', color: '#121225' },
  ],
};

// Runs before paint so the saved (or system) theme never flashes the wrong colours.
const themeScript = `(function(){try{var t=localStorage.getItem('sybrary-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;if(d)r.classList.add('dark');r.style.colorScheme=d?'dark':'light';try{localStorage.removeItem('sybrary-paper')}catch(e){}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] btn btn-sun btn-sm"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
