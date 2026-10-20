import type { Metadata, Viewport } from 'next';
import { Inter, Literata } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import ScrollToTop from '@/components/ScrollToTop';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import SearchModal from '@/components/SearchModal';
import { preferencesScript } from '@/lib/preferences';

const ui = Inter({ subsets: ['latin', 'greek'], variable: '--font-ui', display: 'swap' });
const reading = Literata({ subsets: ['latin', 'greek'], variable: '--font-reading', display: 'swap', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Bible Logos — Personal Bible Study & Research',
  description: "Read the Bible in 19 openly licensed translations with every KJV word linked to its Hebrew or Greek original, Strong's concordance and cross-references.",
  keywords: ['Bible', 'study', "Strong's concordance", 'cross-references', 'KJV', 'BSB', 'WEB', 'LSV', 'Hebrew', 'Greek'],
  openGraph: {
    title: 'Bible Logos — Personal Bible Study & Research',
    description: "Personal Bible study with Strong's concordance, cross-references and translation comparison.",
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f5' },
    { media: '(prefers-color-scheme: dark)', color: '#141210' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${ui.variable} ${reading.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
      </head>
      <body className="min-h-screen bg-parchment-950 text-parchment-100">
        <ReadingProgress />
        <div className="lg:flex">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col min-h-[calc(100dvh-3.5rem)] lg:min-h-screen">
            <div className="flex-1 [&>main]:w-full [&>main]:mx-auto">{children}</div>
            <Footer />
          </div>
        </div>
        <ScrollToTop />
        <SearchModal />
      </body>
    </html>
  );
}
