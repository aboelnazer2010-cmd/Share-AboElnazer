import type {Metadata} from 'next';
import { DM_Sans, Outfit } from 'next/font/google';
import Script from 'next/script'; // إضافة هذا السطر
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Share AboElnazer — P2P File Sharing & Chat',
  description: 'Decentralized peer-to-peer file sharing and chat application. No servers, no accounts — just direct connections.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
      <head>
        {/* إضافة سكريبت جوجل أدسنس */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased bg-stone-950 text-stone-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
