import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeopleFlow — HR for growing companies',
  description:
    'A modern, AI-first HR operating system for SMB and midmarket teams. Onboarding, time off, performance, and payroll-ready records — without the enterprise complexity.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'PeopleFlow — HR for growing companies',
    description:
      'A modern, AI-first HR operating system for SMB and midmarket teams.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Instrument Serif is loaded via stylesheet rather than next/font so
          builds work in offline/sandboxed environments. In production with
          internet access, you can swap this back to:
            const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400' });
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
