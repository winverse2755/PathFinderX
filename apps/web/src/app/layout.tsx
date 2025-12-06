import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

import { Navbar } from '@/components/navbar';
import Providers from "@/components/providers"

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
const frame = {
  version: "1",
  imageUrl: `${appUrl}/opengraph-image.png`,
  button: {
    title: "Launch PathFinderX",
    action: {
      type: "launch_frame",
      name: "pathfinderx",
      url: appUrl,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#FCFF52",
    },
  },
};

export const metadata: Metadata = {
  title: 'PathFinderX',
  description: 'A gamified treasure-hunt protocol that turns the world into an interactive playground. Players follow clues, complete challenges, and claim rewards — all secured transparently on Celo',
  openGraph: {
    title: 'PathFinderX',
    description: 'A gamified treasure-hunt protocol that turns the world into an interactive playground. Players follow clues, complete challenges, and claim rewards — all secured transparently on Celo',
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body">
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col bg-celo-tan-light">
          <Providers>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
